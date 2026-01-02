import { Request, Response, NextFunction } from 'express';

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const secretKey = req.header('x-secret-key');

    if (!secretKey) {
        res.status(401).json({
            error: 'Access Denied',
            message: 'Secret key is required',
        });
        return;
    }

    if (secretKey !== process.env.SECRET_KEY) {
        res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid secret key',
        });
        return;
    }

    next();
};
