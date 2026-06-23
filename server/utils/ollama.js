const http = require('http');
const https = require('https');

/**
 * Standard HTTP/HTTPS POST utility to avoid native fetch (Undici) Header Timeout errors on local CPU model runs.
 */
function postJSON(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => {
            try {
              return Promise.resolve(JSON.parse(body));
            } catch (e) {
              return Promise.reject(new Error(`Failed to parse response body as JSON. Code ${res.statusCode}: ${e.message}\nBody: ${body}`));
            }
          }
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    // Disable default timeouts to give Ollama CPU all the time it needs
    req.setTimeout(0);

    req.write(postData);
    req.end();
  });
}

/**
 * Standard HTTP/HTTPS GET utility to fetch available tags/models from local Ollama instance.
 */
function getJSON(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET'
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => {
            try {
              return Promise.resolve(JSON.parse(body));
            } catch (e) {
              return Promise.reject(new Error(`Failed to parse response body as JSON. Code ${res.statusCode}: ${e.message}\nBody: ${body}`));
            }
          }
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.setTimeout(5000); // 5s timeout to fetch tags is plenty
    req.end();
  });
}

/**
 * Fetch list of pulled model names from the local Ollama instance
 */
async function getAvailableModels(cleanUrl) {
  try {
    const response = await getJSON(`${cleanUrl}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.models)) {
        return data.models.map(m => m.name);
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch local Ollama models list from /api/tags:`, err.message);
  }
  return [];
}

/**
 * Generate a quiz using a local Ollama instance
 * @param {Object} params
 * @param {string} params.url - Ollama base URL (e.g. http://localhost:11434)
 * @param {string} params.model - Ollama model name (e.g. llama3)
 * @param {string} params.subjectKey - Subject key (quant, ga, etc.)
 * @param {string} params.topic - Topic name (e.g. Ratio and Proportion)
 * @param {string} params.reflection - User feynman reflection text
 * @param {string} params.exam - Exam target (e.g. SSC CGL)
 * @returns {Promise<Array>} List of generated questions
 */
async function generateQuizFromOllama({ url, model, subjectKey, topic, reflection, exam }) {
  const cleanUrl = url.replace(/\/$/, '');
  const chatEndpoint = `${cleanUrl}/api/chat`;

  // Fetch available models first to ensure we don't request a non-existent one
  const availableModels = await getAvailableModels(cleanUrl);
  let activeModel = model;

  if (availableModels.length > 0) {
    const requestedModelClean = model.toLowerCase().trim();
    const match = availableModels.find(m => {
      const mClean = m.toLowerCase().trim();
      return mClean === requestedModelClean || 
             mClean === `${requestedModelClean}:latest` ||
             requestedModelClean === `${mClean}:latest` ||
             mClean.split(':')[0] === requestedModelClean;
    });

    if (match) {
      activeModel = match;
    } else {
      activeModel = availableModels[0];
      console.warn(`Requested model "${model}" not found in local Ollama. Falling back to available model: "${activeModel}"`);
    }
  } else {
    console.warn(`No models found in local Ollama or failed to connect. Attempting to use requested model "${model}"...`);
  }

  // Map subject key to a descriptive readable label for richer AI context
  const subjectLabels = {
    quant: 'Quantitative Aptitude (Mathematics)',
    reasoning: 'Logical / Verbal Reasoning',
    ga: 'General Awareness (Static GK + Current Affairs)',
    english: 'English Language & Comprehension',
    gk: 'General Knowledge',
    science: 'General Science',
    computer: 'Computer Awareness',
    default: subjectKey
  };
  const subjectLabel = subjectLabels[subjectKey?.toLowerCase()] || subjectLabels.default;

  const systemPrompt = `You are a senior question-paper setter and examiner specializing in competitive government exams in India, specifically the "${exam}" exam.

Your current task: Generate practice MCQs for the subject "${subjectLabel}" on the specific chapter/topic: "${topic}".

Rules:
- Questions must be strictly relevant to "${topic}" under "${subjectLabel}".
- Follow the exact question patterns, difficulty levels, and style used in "${exam}" exams.
- For Quantitative Aptitude: include numerical problems, shortcut tricks, and calculation-based questions.
- For Logical/Verbal Reasoning: include pattern-based, analogy, classification, and series questions with realistic values.
- For General Awareness: include factual, current affairs, and static GK questions specific to the exam syllabus.
- Each option must be a REAL, meaningful, distinct answer — never use placeholder text like "Option 1" or "Option A".
- The correct answer and explanation must be accurate and educational.`;

  const userPrompt = `Generate exactly 5 high-quality MCQ questions on the topic: "${topic}" (${subjectLabel}) for the "${exam}" exam.

The student studied the following today (use this as context for difficulty and focus areas):
"${reflection}"

CRITICAL FORMAT RULES:
1. "options" MUST be a JSON object with keys "A", "B", "C", "D" — NOT an array.
2. Each option value must be a REAL answer string, never "Option 1" or "Option A".
3. "correctAnswer" must be one of: "A", "B", "C", or "D".
4. "explanation" must clearly explain why the answer is correct with step-by-step reasoning.
5. Output ONLY valid JSON. No markdown, no extra text, no code fences.

Example of the EXACT format required:
{
  "questions": [
    {
      "questionText": "If the ratio of two numbers is 3:5 and their sum is 96, what is the larger number?",
      "options": {
        "A": "36",
        "B": "60",
        "C": "48",
        "D": "72"
      },
      "correctAnswer": "B",
      "explanation": "Let the numbers be 3x and 5x. Then 3x + 5x = 96, so 8x = 96, x = 12. The larger number is 5x = 60."
    }
  ]
}

Now generate 5 such questions on "${topic}":`;

  console.log(`Sending quiz generation request to Ollama: ${chatEndpoint} using model "${activeModel}" (requested: "${model}")...`);

  try {
    const response = await postJSON(chatEndpoint, {
      model: activeModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false,
      options: {
        temperature: 0.4
      },
      format: 'json'
    });

    if (!response.ok) {
      throw new Error(`Ollama returned status: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.message?.content || '';

    if (!content) {
      throw new Error('Ollama response content was empty.');
    }

    // Try parsing content
    let quizData;
    try {
      quizData = JSON.parse(content);
    } catch (parseErr) {
      console.warn('Ollama response was not direct valid JSON. Attempting regex extraction...', parseErr);
      
      // Attempt to extract JSON using regex in case of markdown wrapping or extra conversational text
      const jsonRegex = /\{[\s\S]*\}/;
      const match = content.match(jsonRegex);
      if (match) {
        try {
          quizData = JSON.parse(match[0]);
        } catch (subParseErr) {
          throw new Error('Regex matched block was still not valid JSON: ' + subParseErr.message);
        }
      } else {
        throw new Error('Could not find any JSON bracket structure in response content.');
      }
    }

    if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error('Invalid JSON format: missing "questions" array.');
    }

    const OPTION_KEYS = ['A', 'B', 'C', 'D'];

    /**
     * Safely extract a plain string from any option value.
     * Handles: plain string, number, nested object, array of strings, etc.
     * Prevents "[object Object]" from ever reaching the UI.
     */
    function safeOptionText(val, fallback) {
      if (val == null) return fallback;
      if (typeof val === 'string') return val.trim() || fallback;
      if (typeof val === 'number' || typeof val === 'boolean') return String(val);
      if (Array.isArray(val)) {
        // e.g. ["cat", "dog"] → "cat, dog"
        return val.map(v => safeOptionText(v, '')).filter(Boolean).join(', ') || fallback;
      }
      if (typeof val === 'object') {
        // Try common text-like keys the model might use
        const textKeys = ['text', 'value', 'answer', 'option', 'label', 'description', 'content', 'name', 'choice'];
        for (const k of textKeys) {
          if (val[k] && typeof val[k] === 'string' && val[k].trim()) return val[k].trim();
        }
        // Last resort: stringify but strip outer braces/quotes to keep it readable
        const str = JSON.stringify(val);
        return str !== '{}' ? str : fallback;
      }
      return fallback;
    }

    // Validate and clean questions list
    const validatedQuestions = quizData.questions.map((q, idx) => {
      if (!q.questionText) {
        q.questionText = `Practice Question ${idx + 1} on ${topic}`;
      }

      // Normalize options: handle object {A,B,C,D}, array, or nested-object formats
      if (Array.isArray(q.options)) {
        // Model returned options as an array — convert to keyed object
        const arr = q.options;
        q.options = {
          A: safeOptionText(arr[0], 'Choice A'),
          B: safeOptionText(arr[1], 'Choice B'),
          C: safeOptionText(arr[2], 'Choice C'),
          D: safeOptionText(arr[3], 'Choice D'),
        };
      } else if (!q.options || typeof q.options !== 'object') {
        q.options = { A: 'Choice A', B: 'Choice B', C: 'Choice C', D: 'Choice D' };
      } else {
        // Ensure all of A, B, C, D exist and are safe plain strings
        OPTION_KEYS.forEach(opt => {
          q.options[opt] = safeOptionText(q.options[opt], `Choice ${opt}`);
        });
      }

      // Normalize correctAnswer — may be "1", "2", "3", "4" (index-based) from some models
      if (!q.correctAnswer) {
        q.correctAnswer = 'A';
      } else {
        const ca = String(q.correctAnswer).toUpperCase().trim();
        if (OPTION_KEYS.includes(ca)) {
          q.correctAnswer = ca;
        } else if (['1','2','3','4'].includes(ca)) {
          // Convert 1-based index to letter
          q.correctAnswer = OPTION_KEYS[parseInt(ca) - 1] || 'A';
        } else {
          q.correctAnswer = 'A';
        }
      }

      if (!q.explanation) {
        q.explanation = 'No explanation provided.';
      }
      return q;
    });

    return validatedQuestions;
  } catch (error) {
    console.error('Error generating quiz from Ollama:', error);
    throw error;
  }
}

module.exports = {
  generateQuizFromOllama
};
