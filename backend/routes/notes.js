import express from 'express';
import userAuth from "../middleware/userAuth.js";
import {
    getNotes,
    getTrends,
    createNote,
    updateNote,
    deleteNote
} from '../controllers/noteController.js';

const notesRouter = express.Router();

notesRouter.get('/', getNotes);
notesRouter.get('/trends', getTrends);
notesRouter.post('/', createNote);
notesRouter.put('/:id', updateNote);
notesRouter.delete('/:id', deleteNote);

export default notesRouter;