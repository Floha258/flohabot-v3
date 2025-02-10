import { Router } from 'express';
import { quotesRouter } from './quotesApi.js';

export const apiRouter = Router();

apiRouter.use('/quotes', quotesRouter);
