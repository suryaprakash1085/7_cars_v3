# Deployment Guide

## Build
```bash
npm run build
```
Creates `build/` folder with both frontend and backend.

## Run
```bash
node build/server.js
```
Starts both apps:
- Frontend: http://localhost:3000
- Backend: http://localhost:9005

## Environment Setup

Create `.env` in `SL_DN_BE_AX_WEBAPP_1125.002/`:
```env
PORT=9005
NODE_ENV=production
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=db_user
DB_PASSWORD=password
DB_NAME=vehicle_db
JWT_SECRET=your_secret_key
```

Create `.env` in `SL_DN_FE_AX_WEBAPP_1125.002/`:
```env
NEXT_PUBLIC_API_URL=http://your-backend-url
```

## Production Deployment

### Self-Hosted
1. Copy project to server
2. Run `npm run build`
3. Run `node build/server.js`
4. Use PM2 to keep running:
   ```bash
   npm install -g pm2
   pm2 start build/server.js
   ```

### Docker
```bash
docker build -t vehicle-app .
docker run -p 3000:3000 -p 9005:9005 --env-file .env vehicle-app
```

## Commands
- `npm run build` - Build for production
- `npm run start:prod` - Run production build
- `npm run dev` - Run development mode

Done! 🚀
