import app from './app';
import logger from './config/logger';

const PORT: number = parseInt(process.env.PORT || '3002', 10);

app.listen(PORT, (): void => {
    logger.info(`Server running on http://localhost:${PORT}`);
});
