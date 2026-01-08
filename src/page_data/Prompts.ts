export default {
  // API 接口请求优先，数据格式保持和 data 一致
  api: '',
  // api 为空则使用 data 静态数据
  data: [
    {
      id: 'prompt-001',
      title: '代码审查专家',
      category: '编程开发',
      content: '你是一位经验丰富的代码审查专家，请对以下代码进行全面的审查，包括：\n1. 代码风格和规范性\n2. 潜在的 bug 和边界情况\n3. 性能优化建议\n4. 安全性问题\n\n请提供具体的改进建议。',
      sourceLink: 'https://example.com/prompt-001',
      image: '/assets/images/prompts/code-review.webp'
    },
    {
      id: 'prompt-002',
      title: '技术文档撰写助手',
      category: '文档写作',
      content: '请作为一位技术文档专家，将以下技术内容改写为清晰易懂的文档，要求：\n- 结构清晰，层次分明\n- 使用简洁的语言\n- 添加必要的示例代码\n- 包含常见问题解答',
      sourceLink: 'https://example.com/prompt-002',
      image: '/assets/images/prompts/tech-doc.webp'
    }
  ]
}
