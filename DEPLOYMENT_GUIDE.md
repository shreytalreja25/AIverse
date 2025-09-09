# AIverse Deployment Guide

## Quick Start for Friends

### Prerequisites
- Docker and Docker Compose installed
- Git installed

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd AIverse
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file with your API keys:**
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this
   GEMINI_API_KEY=your-gemini-api-key
   OPENAI_API_KEY=your-openai-api-key
   HUGGINGFACE_API_KEY=your-huggingface-api-key
   ```

4. **Start the application:**
   ```bash
   docker-compose up -d
   ```

5. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Deployment Options

### Option 1: Docker Hub (Recommended)
1. Push images to Docker Hub
2. Friends can pull and run with docker-compose

### Option 2: Cloud Platforms
- **Vercel** (Frontend) + **Railway** (Backend)
- **DigitalOcean App Platform**
- **AWS ECS** or **Google Cloud Run**

### Option 3: VPS Deployment
- Rent a VPS (DigitalOcean, Linode, etc.)
- Install Docker
- Clone repo and run docker-compose

## Troubleshooting

### Common Issues:
1. **Port conflicts**: Change ports in docker-compose.yml
2. **API keys missing**: Check .env file
3. **Database connection**: Ensure MongoDB is running
4. **CORS issues**: Check API_BASE_URL in backend

### Health Checks:
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000
- Database: Check MongoDB logs

## Production Considerations

1. **Security:**
   - Change default JWT secret
   - Use strong passwords
   - Enable HTTPS

2. **Performance:**
   - Use production MongoDB (Atlas)
   - Configure Redis for caching
   - Set up CDN for static assets

3. **Monitoring:**
   - Set up logging
   - Monitor resource usage
   - Configure alerts
