# CNC刀路可视化演示

一个基于React + Three.js的桌面CNC刀路可视化演示应用，支持G-code解析、刀路动画演示和模型切削效果展示。

## 功能特性

- 🎯 **G-code解析器** - 解析标准G-code文件，提取刀具路径信息
- 🎨 **3D可视化** - 使用Three.js渲染逼真的3D场景
- ✂️ **切削效果** - 使用CSG（构造实体几何）实现模型布尔减运算
- 🎬 **刀路动画** - 支持刀路播放/暂停和进度控制
- 🔧 **交互控制** - 支持模型旋转、缩放和平移
- 👁️ **多视图模式** - 支持原始模型、切削后模型和对比视图
- 📂 **文件导入** - 支持上传自定义G-code文件

## 技术栈

- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Three.js** - 3D渲染引擎
- **@react-three/fiber** - React Three.js渲染器
- **@react-three/drei** - Three.js辅助组件
- **three-bvh-csg** - CSG布尔运算库

## 安装

```bash
# 安装依赖
npm install
```

## 开发

```bash
# 启动开发服务器
npm run dev

# 类型检查
npx tsc --noEmit

# 代码检查
npm run lint
```

## 构建

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 使用说明

### 基本操作

1. **启动应用** - 运行 `npm run dev` 后在浏览器中打开 http://localhost:3000
2. **查看示例** - 应用会自动加载示例G-code文件
3. **上传G-code** - 点击"上传G-code文件"按钮选择您的G-code文件
4. **播放动画** - 点击播放按钮查看刀路动画
5. **切换视图** - 使用视图切换按钮在不同模式间切换
6. **调整进度** - 拖动进度条控制动画播放位置

### 视图模式

- **原始模型** - 显示未切削的原始模型
- **切削后** - 显示经过切削操作后的模型
- **对比视图** - 同时显示原始模型和切削后模型

### 3D场景控制

- **旋转** - 左键拖动
- **平移** - 右键拖动
- **缩放** - 滚轮

### G-code支持

支持以下常用G代码：

- `G0` - 快速移动
- `G1` - 直线插补
- `G2/G3` - 圆弧插补
- `G17/G18/G19` - 平面选择
- `G90/G91` - 绝对/相对定位
- `M3/M4/M5` - 主轴控制
- `T` - 换刀
- `S` - 主轴转速
- `F` - 进给率

## 项目结构

```
CNC-Digital/
├── src/
│   ├── components/          # React组件
│   │   ├── ModelViewer.tsx  # 3D场景组件
│   │   ├── ToolpathVisualizer.tsx  # 刀路可视化
│   │   ├── CSGModel.tsx     # CSG模型组件
│   │   └── ControlPanel.tsx # 控制面板
│   ├── lib/                 # 工具函数
│   │   ├── gcodeParser.ts   # G-code解析器
│   │   └── csgHelper.ts     # CSG辅助函数
│   ├── types/               # TypeScript类型
│   │   └── index.ts
│   ├── data/                # 示例数据
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # React入口
│   └── index.css           # 全局样式
├── public/                  # 静态资源
├── index.html              # HTML入口
├── vite.config.ts          # Vite配置
├── tsconfig.json           # TypeScript配置
└── package.json            # 项目配置
```

## 注意事项

- CSG操作可能在复杂场景下影响性能
- 大型G-code文件可能需要较长的解析时间
- 确保浏览器支持WebGL
- 建议使用Chrome、Firefox或Edge等现代浏览器

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！