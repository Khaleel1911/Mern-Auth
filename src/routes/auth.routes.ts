import express from 'express'
import { forgotPasswordHandler, loginHandler, refreshHandler, registerHandler, resetPasswordHandler, verifyEmailHandler } from '../controllers/auth/auth.controller';

const router = express.Router();


router.post('/register',registerHandler);

router.get('/verify-email',verifyEmailHandler);

router.post('/login',loginHandler);

router.post('/refresh',refreshHandler);

router.post('/logout',loginHandler);

router.post("/forgot-password",forgotPasswordHandler);

router.post('/reset-password',resetPasswordHandler)

export default router;