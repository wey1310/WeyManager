import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));

// Initialize Gemini client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Verification for initial garden entrance gate password
app.post('/api/verify-gate-password', (req, res) => {
  const { password, customSavedPassword } = req.body;
  const initialDefault = '#LeSiYin1310';
  const validPassword = customSavedPassword || initialDefault;

  if (password === validPassword || password === initialDefault) {
    return res.json({ success: true, message: 'Chào mừng vào vườn của Wey!' });
  }

  return res.status(401).json({ success: false, message: 'Mật khẩu vào vườn không chính xác.' });
});

// OCR endpoint for Timetable images (Vision AI)
app.post('/api/ocr-timetable', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Không tìm thấy dữ liệu hình ảnh' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên server để nhận diện thời khóa biểu.',
      });
    }

    let effectiveMime = mimeType || 'image/jpeg';
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      effectiveMime = mimeMatch[1];
    }
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').trim();

    const prompt = `Bạn là chuyên gia trợ lý giáo viên Việt Nam phân tích ảnh Thời khóa biểu (TKB) giáo viên THCS.
Nhiệm vụ: Trích xuất chính xác tất cả các tiết giảng dạy của giáo viên trong ảnh.
Quy tắc:
- Buổi học (session): "morning" nếu là buổi Sáng (thường Tiết 1 đến Tiết 5), "afternoon" nếu là buổi Chiều (Tiết 1 đến Tiết 5).
- Thứ trong tuần (dayOfWeek): Số nguyên từ 2 đến 7 (2 = Thứ 2, 3 = Thứ 3, ..., 7 = Thứ 7; nếu có Chủ nhật thì 8).
- Tiết học (period): Số nguyên từ 1 đến 5 của buổi đó.
- Lớp học (className): Tên lớp ngắn gọn (ví dụ: "6A1", "7A2", "8B", "9C", "6/1", "7/2"...).
- Môn học (subject): Tên môn học hoặc tiết sinh hoạt (ví dụ: "KHTN", "Khoa học tự nhiên", "Toán", "Vật lí", "Sinh học", "Hóa học", "SHCN", "HĐTN", "Chào cờ"...).
- Ghi chú (note): Nội dung ghi chú nếu có (ví dụ: "Phòng thực hành", "Trực tuần"...).
- ĐẶC BIỆT: KHÔNG CẦN VÀ KHÔNG TRÍCH XUẤT THÔNG TIN PHÒNG HỌC.

Chỉ trả về danh sách các tiết học theo đúng schema JSON.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dayOfWeek: { type: Type.INTEGER, description: '2 to 8' },
              session: { type: Type.STRING, enum: ['morning', 'afternoon'], description: 'morning or afternoon' },
              period: { type: Type.INTEGER, description: '1 to 5' },
              className: { type: Type.STRING },
              subject: { type: Type.STRING },
              note: { type: Type.STRING },
            },
            required: ['dayOfWeek', 'period', 'className', 'subject'],
          },
        },
      },
      required: ['items'],
    };

    // Try primary model, fallback to alternative flash models on 503 or transient issues
    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
    let lastError: any = null;
    let responseText = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: effectiveMime,
              },
            },
            prompt,
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        responseText = response.text || '';
        if (responseText) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed in /api/ocr-timetable, trying fallback...`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Không nhận được phản hồi từ AI');
    }

    const parsed = JSON.parse(responseText);
    const sanitizedItems = (parsed.items || []).map((it: any) => ({
      dayOfWeek: Number(it.dayOfWeek) || 2,
      session: it.session === 'afternoon' ? 'afternoon' : 'morning',
      period: Math.min(Math.max(Number(it.period) || 1, 1), 5),
      className: String(it.className || '').trim(),
      subject: String(it.subject || '').trim(),
      note: it.note ? String(it.note).trim() : '',
    })).filter((it: any) => it.className && it.subject);

    return res.json({ items: sanitizedItems });
  } catch (err: any) {
    console.error('Error in /api/ocr-timetable:', err);
    return res.status(500).json({
      error: 'Không thể phân tích ảnh thời khóa biểu: ' + (err.message || 'Lỗi không xác định'),
    });
  }
});

// Mount Vite or static server
async function setupServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🌿 Vườn của Wey server is running on http://0.0.0.0:${port}`);
  });
}

setupServer();
