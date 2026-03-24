# AEGIS Vision System Backend

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the Server

Start the FastAPI server:
```bash
python main.py
```

The server will start on `http://localhost:8000`

### API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Available Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check and model status
- `POST /detect/objects` - Object detection using YOLOv8n
- `POST /detect/faces` - Face detection using OpenCV
- `POST /analyze/camera-feed` - Combined analysis of camera feed

### Testing

You can test the API using the Swagger UI or with curl:

```bash
# Health check
curl http://localhost:8000/health

# Object detection
curl -X POST "http://localhost:8000/detect/objects" -H "accept: application/json" -H "Content-Type: multipart/form-data" -F "file=@your_image.jpg"
```

### Model Information

- **Object Detection**: YOLOv8n (nano version) - Fast and lightweight
- **Face Detection**: OpenCV Haar Cascades - Built-in, no additional models needed
- **Hardware**: Runs on CPU by default, can be configured for GPU

### Configuration

The server is configured to accept requests from:
- http://localhost:5173 (Vite dev server)
- http://localhost:3000 (React dev server)

You can modify the CORS settings in `main.py` if needed.
