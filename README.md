# Trading Dashboard

Real-time crypto trading dashboard for Binance Futures.

## Features

- Real-time position monitoring
- P&L tracking
- SL/TP visualization
- Balance and margin info
- Telegram alerts

## Setup

```bash
pip install flask requests
python3 dashboard_api.py
```

Access at `http://YOUR_IP:8443`

## API

- `GET /api/status` - Bot and balance status
- `GET /api/positions` - Open positions
- `GET /api/signals` - Recent signals
- `GET /api/history` - Trade history

---

Built by Ellie 💜
