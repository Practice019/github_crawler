import { useRef } from 'react';
import {
  fadeIn,
  scaleIn,
  slideInLeft,
  slideInRight,
  bounceIn,
  pulse,
  shake,
  staggerFadeIn
} from '../utils/animations';
import AnimatedButton from '../components/AnimatedButton';
import Toast from '../components/Toast';
import { SkeletonCard } from '../components/SkeletonCard';
import ProgressBar from '../components/ProgressBar';
import CountUp from '../components/CountUp';
import './AnimationDemo.css';

function AnimationDemo() {
  const box1Ref = useRef(null);
  const box2Ref = useRef(null);
  const box3Ref = useRef(null);
  const box4Ref = useRef(null);
  const box5Ref = useRef(null);
  const box6Ref = useRef(null);

  return (
    <div className="animation-demo">
      <h1>🎨 动画效果演示</h1>

      <section className="demo-section">
        <h2>基础动画</h2>
        <div className="demo-grid">
          <div className="demo-item">
            <div ref={box1Ref} className="demo-box">淡入</div>
            <button onClick={() => fadeIn(box1Ref.current)}>播放</button>
          </div>

          <div className="demo-item">
            <div ref={box2Ref} className="demo-box">缩放</div>
            <button onClick={() => scaleIn(box2Ref.current)}>播放</button>
          </div>

          <div className="demo-item">
            <div ref={box3Ref} className="demo-box">左滑入</div>
            <button onClick={() => slideInLeft(box3Ref.current)}>播放</button>
          </div>

          <div className="demo-item">
            <div ref={box4Ref} className="demo-box">右滑入</div>
            <button onClick={() => slideInRight(box4Ref.current)}>播放</button>
          </div>

          <div className="demo-item">
            <div ref={box5Ref} className="demo-box">弹跳</div>
            <button onClick={() => bounceIn(box5Ref.current)}>播放</button>
          </div>

          <div className="demo-item">
            <div ref={box6Ref} className="demo-box">脉冲</div>
            <button onClick={() => pulse(box6Ref.current)}>播放</button>
          </div>
        </div>
      </section>

      <section className="demo-section">
        <h2>按钮组件</h2>
        <div className="demo-buttons">
          <AnimatedButton variant="primary">主要按钮</AnimatedButton>
          <AnimatedButton variant="secondary">次要按钮</AnimatedButton>
          <AnimatedButton variant="success">成功按钮</AnimatedButton>
          <AnimatedButton variant="danger">危险按钮</AnimatedButton>
          <AnimatedButton variant="outline">轮廓按钮</AnimatedButton>
          <AnimatedButton loading>加载中...</AnimatedButton>
        </div>
      </section>

      <section className="demo-section">
        <h2>骨架屏</h2>
        <SkeletonCard />
      </section>

      <section className="demo-section">
        <h2>进度条</h2>
        <ProgressBar current={65} total={100} label="下载进度" />
      </section>

      <section className="demo-section">
        <h2>数字计数</h2>
        <div className="demo-counter">
          <CountUp end={12345} suffix=" Stars" />
        </div>
      </section>
    </div>
  );
}

export default AnimationDemo;
