import 'dotenv/config';
import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Server chạy tại http://localhost:${port}`));