const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const STATUS_FILE = path.join(__dirname, '..', '..', '..', 'introductions', '.status.json');

// 默认标签
const DEFAULT_TAGS = [
  { id: 'unread', label: '未读', color: '#6366f1' },
  { id: 'valuable', label: '有价值', color: '#10b981' },
  { id: 'not-valuable', label: '无价值', color: '#ef4444' }
];

// 读取状态文件
async function readStatus() {
  try {
    const data = await fs.readFile(STATUS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // 确保有 tags、projectStatuses、favorites 和 notes 字段
    return {
      tags: parsed.tags || DEFAULT_TAGS,
      projectStatuses: parsed.projectStatuses || {},
      favorites: parsed.favorites || [],
      notes: parsed.notes || {}
    };
  } catch (error) {
    // 文件不存在，返回默认值
    return {
      tags: DEFAULT_TAGS,
      projectStatuses: {},
      favorites: [],
      notes: {}
    };
  }
}

// 保存状态文件
async function saveStatus(data) {
  await fs.writeFile(STATUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/project-status - 获取所有项目状态和标签
router.get('/', async (req, res) => {
  try {
    const data = await readStatus();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('读取状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/project-status/:id - 更新项目状态
router.put('/:id', [
  param('id').trim().isLength({ min: 1, max: 200 }).matches(/^[a-zA-Z0-9_.-]+$/),
  body('status').trim().isLength({ min: 1, max: 100 })
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '无效的输入参数',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { status: newStatus } = req.body;

    const data = await readStatus();

    // 验证状态值是否存在于标签列表中
    const validTag = data.tags.find(tag => tag.id === newStatus);
    if (!validTag) {
      return res.status(400).json({
        success: false,
        error: '无效的状态值'
      });
    }

    data.projectStatuses[id] = newStatus;
    await saveStatus(data);

    res.json({
      success: true,
      data: { id, status: newStatus }
    });
  } catch (error) {
    console.error('更新状态失败:', error);
    res.status(500).json({
      success: false,
      error: '更新状态失败'
    });
  }
});

// POST /api/project-status/tags - 创建新标签
router.post('/tags', [
  body('label').trim().isLength({ min: 1, max: 50 }),
  body('color').trim().matches(/^#[0-9a-fA-F]{6}$/)
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '无效的输入参数',
        details: errors.array()
      });
    }

    const { label, color } = req.body;

    const data = await readStatus();

    // 使用加密安全的随机数生成 ID
    const id = `tag_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

    const newTag = { id, label, color };
    data.tags.push(newTag);

    await saveStatus(data);

    res.json({
      success: true,
      data: newTag
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    res.status(500).json({
      success: false,
      error: '创建标签失败'
    });
  }
});

// DELETE /api/project-status/tags/:tagId - 删除标签
router.delete('/tags/:tagId', async (req, res) => {
  try {
    const { tagId } = req.params;

    const data = await readStatus();

    // 不允许删除默认标签
    const defaultTagIds = DEFAULT_TAGS.map(t => t.id);
    if (defaultTagIds.includes(tagId)) {
      return res.status(400).json({
        success: false,
        error: '不能删除默认标签'
      });
    }

    // 删除标签
    data.tags = data.tags.filter(tag => tag.id !== tagId);

    // 将使用该标签的项目重置为 unread
    Object.keys(data.projectStatuses).forEach(projectId => {
      if (data.projectStatuses[projectId] === tagId) {
        data.projectStatuses[projectId] = 'unread';
      }
    });

    await saveStatus(data);

    res.json({
      success: true,
      message: '标签已删除'
    });
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/project-status/tags/:tagId - 重命名标签
router.put('/tags/:tagId', [
  param('tagId').trim().isLength({ min: 1, max: 100 }),
  body('label').trim().isLength({ min: 1, max: 50 }),
  body('color').optional().trim().matches(/^#[0-9a-fA-F]{6}$/)
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '无效的输入参数',
        details: errors.array()
      });
    }

    const { tagId } = req.params;
    const { label, color } = req.body;

    const data = await readStatus();

    // 不允许重命名默认标签
    const defaultTagIds = DEFAULT_TAGS.map(t => t.id);
    if (defaultTagIds.includes(tagId)) {
      return res.status(400).json({
        success: false,
        error: '不能重命名默认标签'
      });
    }

    // 查找并更新标签
    const tagIndex = data.tags.findIndex(tag => tag.id === tagId);
    if (tagIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '标签不存在'
      });
    }

    data.tags[tagIndex].label = label;
    if (color) {
      data.tags[tagIndex].color = color;
    }

    await saveStatus(data);

    res.json({
      success: true,
      data: data.tags[tagIndex]
    });
  } catch (error) {
    console.error('重命名标签失败:', error);
    res.status(500).json({
      success: false,
      error: '重命名标签失败'
    });
  }
});

// POST /api/project-status/favorites/:id - 添加收藏
router.post('/favorites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readStatus();

    // 如果还没收藏，添加到收藏列表
    if (!data.favorites.includes(id)) {
      data.favorites.push(id);
      await saveStatus(data);
    }

    res.json({
      success: true,
      data: { id, favorited: true }
    });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/project-status/favorites/:id - 取消收藏
router.delete('/favorites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readStatus();

    // 从收藏列表中移除
    data.favorites = data.favorites.filter(fav => fav !== id);
    await saveStatus(data);

    res.json({
      success: true,
      data: { id, favorited: false }
    });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/project-status/notes/:projectId - 获取项目备注
router.get('/notes/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const data = await readStatus();

    const note = data.notes[projectId] || null;

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('获取备注失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/project-status/notes/:projectId - 创建/更新项目备注
router.put('/notes/:projectId', [
  param('projectId').trim().isLength({ min: 1, max: 200 }).matches(/^[a-zA-Z0-9_.-]+$/),
  body('content').trim().isLength({ min: 0, max: 5000 })
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '无效的输入参数',
        details: errors.array()
      });
    }

    const { projectId } = req.params;
    const { content } = req.body;

    const data = await readStatus();

    // 如果内容为空字符串，删除备注
    if (!content.trim()) {
      delete data.notes[projectId];
      await saveStatus(data);
      return res.json({
        success: true,
        data: null,
        message: '备注已删除'
      });
    }

    // 验证内容长度
    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        error: '备注内容不能超过 5000 字符'
      });
    }

    const now = new Date().toISOString();
    const existingNote = data.notes[projectId];

    // 创建或更新备注
    const note = {
      content: content,
      createdAt: existingNote ? existingNote.createdAt : now,
      updatedAt: now
    };

    data.notes[projectId] = note;
    await saveStatus(data);

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('保存备注失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/project-status/notes/:projectId - 删除项目备注
router.delete('/notes/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const data = await readStatus();

    // 删除备注
    delete data.notes[projectId];
    await saveStatus(data);

    res.json({
      success: true,
      message: '备注已删除'
    });
  } catch (error) {
    console.error('删除备注失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
