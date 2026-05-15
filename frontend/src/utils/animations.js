/**
 * Anime.js 动画工具函数
 * 提供常用的动画效果
 */

import { animate, stagger, createTimeline } from 'animejs';

/**
 * 淡入动画
 */
export const fadeIn = (targets, options = {}) => {
  return animate(targets, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 600,
    ease: 'outQuad',
    ...options
  });
};

/**
 * 淡出动画
 */
export const fadeOut = (targets, options = {}) => {
  return animate(targets, {
    opacity: 0,
    translateY: -20,
    duration: 400,
    ease: 'inQuad',
    ...options
  });
};

/**
 * 缩放进入动画
 */
export const scaleIn = (targets, options = {}) => {
  return animate(targets, {
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 500,
    ease: 'outBack',
    ...options
  });
};

/**
 * 从左滑入
 */
export const slideInLeft = (targets, options = {}) => {
  return animate(targets, {
    translateX: [-50, 0],
    opacity: [0, 1],
    duration: 600,
    ease: 'outQuad',
    ...options
  });
};

/**
 * 从右滑入
 */
export const slideInRight = (targets, options = {}) => {
  return animate(targets, {
    translateX: [50, 0],
    opacity: [0, 1],
    duration: 600,
    ease: 'outQuad',
    ...options
  });
};

/**
 * 弹跳进入
 */
export const bounceIn = (targets, options = {}) => {
  return animate(targets, {
    translateY: [100, 0],
    opacity: [0, 1],
    scale: [0.5, 1],
    duration: 800,
    ease: 'outBounce',
    ...options
  });
};

/**
 * 交错淡入（用于列表）
 */
export const staggerFadeIn = (targets, options = {}) => {
  return animate(targets, {
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 600,
    delay: stagger(80, { from: 'first' }),
    ease: 'outQuad',
    ...options
  });
};

/**
 * 交错缩放进入（用于网格）
 */
export const staggerScaleIn = (targets, options = {}) => {
  return animate(targets, {
    scale: [0, 1],
    opacity: [0, 1],
    duration: 500,
    delay: stagger(60, { from: 'center' }),
    ease: 'outBack',
    ...options
  });
};

/**
 * 脉冲动画（用于按钮点击反馈）
 */
export const pulse = (targets, options = {}) => {
  return animate(targets, {
    scale: [1, 1.1, 1],
    duration: 300,
    ease: 'inOutQuad',
    ...options
  });
};

/**
 * 摇晃动画（用于错误提示）
 */
export const shake = (targets, options = {}) => {
  return animate(targets, {
    keyframes: [
      { translateX: -10 },
      { translateX: 10 },
      { translateX: -10 },
      { translateX: 10 },
      { translateX: 0 }
    ],
    duration: 500,
    ease: 'outQuad',
    ...options
  });
};

/**
 * 旋转加载动画
 */
export const rotateLoading = (targets, options = {}) => {
  return animate(targets, {
    rotate: 360,
    duration: 1000,
    ease: 'linear',
    loop: true,
    ...options
  });
};

/**
 * 数字计数动画
 */
export const countUp = (element, endValue, options = {}) => {
  const obj = { value: 0 };
  return animate(obj, {
    value: endValue,
    duration: 1000,
    ease: 'outQuad',
    onUpdate: () => {
      if (element) {
        element.textContent = Math.round(obj.value).toLocaleString();
      }
    },
    ...options
  });
};

/**
 * 进度条动画
 */
export const progressBar = (targets, percentage, options = {}) => {
  return animate(targets, {
    width: `${percentage}%`,
    duration: 800,
    ease: 'outQuad',
    ...options
  });
};

/**
 * 卡片悬停动画
 */
export const cardHover = (target) => {
  return animate(target, {
    translateY: -8,
    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
    duration: 300,
    ease: 'outQuad'
  });
};

/**
 * 卡片悬停离开动画
 */
export const cardHoverOut = (target) => {
  return animate(target, {
    translateY: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    duration: 300,
    ease: 'outQuad'
  });
};

/**
 * 创建页面切换时间轴
 */
export const pageTransition = () => {
  const tl = createTimeline({
    defaults: {
      duration: 400,
      ease: 'outQuad'
    }
  });

  return tl;
};

/**
 * 按钮点击反馈
 */
export const buttonClick = (target) => {
  return animate(target, {
    scale: [1, 0.95, 1],
    duration: 200,
    ease: 'inOutQuad'
  });
};

/**
 * 通知弹出动画
 */
export const notificationIn = (target) => {
  return animate(target, {
    translateX: [300, 0],
    opacity: [0, 1],
    duration: 400,
    ease: 'outQuad'
  });
};

/**
 * 通知消失动画
 */
export const notificationOut = (target) => {
  return animate(target, {
    translateX: 300,
    opacity: 0,
    duration: 300,
    ease: 'inQuad'
  });
};

export default {
  fadeIn,
  fadeOut,
  scaleIn,
  slideInLeft,
  slideInRight,
  bounceIn,
  staggerFadeIn,
  staggerScaleIn,
  pulse,
  shake,
  rotateLoading,
  countUp,
  progressBar,
  cardHover,
  cardHoverOut,
  pageTransition,
  buttonClick,
  notificationIn,
  notificationOut
};
