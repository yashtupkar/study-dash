const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get notes (return all notes from all users, populated with uploader's name)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({}).populate('userId', 'name').sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Fetch notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create note
router.post('/', [
  authMiddleware,
  body('title', 'Title is required').notEmpty().trim(),
  body('content', 'Content is required').notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, content } = req.body;

  try {
    const newNote = new Note({
      userId: req.user._id,
      title,
      content
    });

    await newNote.save();
    await newNote.populate('userId', 'name');
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update note (only allow uploader to edit)
router.patch('/:id', [
  authMiddleware,
  body('title', 'Title is required').optional().notEmpty().trim(),
  body('content', 'Content is required').optional().notEmpty().trim()
], async (req, res) => {
  const { title, content } = req.body;

  try {
    let note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Verify owner
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized — you can only edit your own study notes.' });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    note.updatedAt = new Date();

    await note.save();
    await note.populate('userId', 'name');
    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete note (only allow uploader to delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Verify owner
    if (note.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized — you can only delete your own study notes.' });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
