import app from './app';
import logger from '../utils/logger';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
});
