import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './NoteModal.css';

function NoteModal({ projectId, projectName, initialNote, onClose, onSave }) {
  const [content, setContent] = useState(initialNote?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [charCount, setCharCount] = useState(initialNote?.content?.length || 0);
  const textareaRef = useRef(null);

  useEffect(() => {
    // 自动聚焦到文本框
    if (textareaRef.current) {
      textareaRef.current.focus();
      // 将光标移到末尾
      textareaRef.current.setSelectionRange(content.length, content.length);
    }

    // ESC 键关闭模态框
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    // Ctrl+Enter 保存
    const handleCtrlEnter = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSave();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleCtrlEnter);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleCtrlEnter);
    };
  }, [content]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setCharCount(newContent.length);
  };

  const handleClose = () => {
    // 如果有未保存的更改，提示用户
    if (content !== (initialNote?.content || '')) {
      if (!window.confirm('有未保存的更改，确定要关闭吗？')) {
        return;
      }
    }
    onClose();
  };

  const handleSave = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const response = await axios.put(`/api/project-status/notes/${projectId}`, {
        content: content
      });

      if (response.data.success) {
        onSave(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('保存备注失败:', error);
      alert(error.response?.data?.error || '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这条备注吗？')) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await axios.delete(`/api/project-status/notes/${projectId}`);

      if (response.data.success) {
        onSave(null);
        onClose();
      }
    } catch (error) {
      console.error('删除备注失败:', error);
      alert('删除失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getCharCountClass = () => {
    if (charCount > 5000) return 'error';
    if (charCount > 4500) return 'warning';
    return '';
  };

  return (
    <div className="note-modal-overlay" onClick={handleOverlayClick}>
      <div className="note-modal">
        <div className="note-modal-header">
          <h3 className="note-modal-title">{projectName}</h3>
          <p className="note-modal-subtitle">
            {initialNote ? '编辑备注' : '添加备注'}
          </p>
        </div>

        <div className="note-modal-body">
          <textarea
            ref={textareaRef}
            className="note-textarea"
            placeholder="记录使用这个项目的心得、遇到的问题等..."
            value={content}
            onChange={handleContentChange}
            maxLength={5000}
          />
          <div className={`note-char-count ${getCharCountClass()}`}>
            {charCount} / 5000
          </div>
        </div>

        <div className="note-modal-footer">
          <div className="note-timestamps">
            {initialNote && (
              <>
                <div>创建于: {new Date(initialNote.createdAt).toLocaleString('zh-CN')}</div>
                <div>更新于: {new Date(initialNote.updatedAt).toLocaleString('zh-CN')}</div>
              </>
            )}
          </div>
          <div className="note-modal-actions">
            {initialNote && (
              <button
                className="note-btn note-btn-danger"
                onClick={handleDelete}
                disabled={isSaving}
              >
                删除
              </button>
            )}
            <button
              className="note-btn note-btn-secondary"
              onClick={handleClose}
              disabled={isSaving}
            >
              取消
            </button>
            <button
              className="note-btn note-btn-primary"
              onClick={handleSave}
              disabled={isSaving || charCount > 5000}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteModal;
