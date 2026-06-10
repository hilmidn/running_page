# Running Schedule — Wey Oh

Schedule viewer for 12-week Half Marathon + 5K Sub-30 program.

Built with Vite + React + TypeScript + Tailwind CSS.

## Deploy

```bash
npm install
npm run build
```

Deploy ke Vercel dengan root directory `apps/running-schedule`.

## Data

Program di-parse dari `/opt/data/running-program-hm-5k.md` ke `src/data.json`.

Jalanin ulang parser:

```bash
python3 /opt/data/parse_schedule.py
```
