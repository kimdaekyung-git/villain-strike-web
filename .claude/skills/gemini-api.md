# Gemini API Usage Guide

## Model: gemini-2.5-flash-image

### Capabilities

- Image generation from text prompts
- Image editing and transformation
- Vision analysis

### Request Format

```javascript
{
  contents: [{
    parts: [
      { text: "prompt" },
      { inline_data: { mime_type: "image/jpeg", data: "base64..." } }
    ]
  }],
  generationConfig: {
    responseModalities: ['Image']
  }
}
```

### Response Format

```javascript
{
  candidates: [
    {
      content: {
        parts: [
          {
            inline_data: {
              mime_type: 'image/png',
              data: 'base64...',
            },
          },
        ],
      },
    },
  ];
}
```

### Error Handling

- 400: Invalid request
- 401/403: Invalid API key
- 429: Rate limit exceeded
- Timeout: 60초 초과

### Best Practices

- 이미지 크기: 최대 1024px (resizeImageForAPI 사용)
- 재시도: 최대 3회, 지수 백오프
- 캐시: Map으로 중복 요청 방지
