---
title: reaction-diffusion-system
createTime: 2025/09/06 11:31:51
permalink: /article/zgmtfp9r/
---
## 用矢量图作为反应扩散容器

反应扩散系统（Reaction–Diffusion System）是一类能够生成自然花纹的数学模型，广泛应用于生物学、计算机图形学和数字艺术中。本文介绍如何将 **矢量图（SVG）** 当作容器，使反应扩散只在图形内部发生。

---

## 1. 反应扩散系统简介

反应扩散系统由 **化学物质反应和扩散** 组成，通过简单的局部规则就能生成复杂图案。典型形式如下：

∂U/∂t = D_U ∇²U + f(U, V)  
∂V/∂t = D_V ∇²V + g(U, V)

- `U, V`：两种化学物质浓度  
- `D_U, D_V`：扩散速度  
- `f,g`：局部反应方程  
- `∇²`：拉普拉斯算子，表示扩散  

Gray–Scott 模型常用在计算机中：

∂A/∂t = D_A ∇²A - AB² + f(1-A)  
∂B/∂t = D_B ∇²B + AB² - (k+f)B

- `A` 和 `B`：两种化学物质  
- `D_A, D_B`：扩散系数  
- `AB²`：局部反应项  
- `f`：feed rate  
- `k`：kill rate  

---

## 2. 固定容器与边界条件

要让反应扩散只在一个区域（容器）内发生，需要**边界条件**：

- **Neumann（零梯度）**：边界不透过化学物质  
- **Dirichlet（固定值）**：边界浓度固定  
- **周期边界**：边缘与另一侧连通  

在代码中实现方式：

```js
if (mask[x][y]) {  
 // 容器内部，正常更新  
} else {  
 // 容器外部，固定 A=1, B=0  
}
```

---

## 3. 使用矢量图（SVG）作为容器

给定一张矢量图，可以直接生成 **mask**，控制反应扩散只在图形内部：

### 方法 A：渲染到像素再生成 mask

```js
let pg = createGraphics(width, height);  
pg.fill(255);  
pg.noStroke();  
// 在 pg 上绘制矢量图  
pg.beginShape();  
pg.vertex(...); // SVG 点序列  
pg.endShape(CLOSE);

pg.loadPixels();  
for (let x = 0; x < width; x++) {  
 mask[x] = [];  
 for (let y = 0; y < height; y++) {  
  let alpha = pg.pixels[(x + y *width)* 4 + 3];  
  mask[x][y] = (alpha > 0); // true 表示容器内部  
 }  
}
```

### 方法 B：SVG 路径 → 多边形 → 点内检测

- 将 SVG 路径解析为多边形点序列  
- 使用 **点在多边形内算法 (point-in-polygon)**  
- 生成 mask，精度更高，适合高分辨率容器  

---

## 4. 更新反应扩散逻辑

在迭代更新时，只对 mask 内部的格点进行 Gray–Scott 更新，外部格点保持恒定：

```js
if (mask[x][y]) {  
 next[x][y].a = ... // Gray–Scott 更新  
 next[x][y].b = ...  
} else {  
 next[x][y].a = 1;  
 next[x][y].b = 0;  
}
```

渲染时也可以根据 mask 调整颜色：

```js
let c = mask[x][y] ? floor((a - b) * 255) : 30; // 外部显示暗色
```

---

## 5. 优势

- 可以在 **任意矢量形状**（雪花、叶子、logo、动物轮廓）生成自然花纹  
- 容器内部形成复杂图案，外部保持清晰边界  
- 非常适合 **数字艺术创作** 或 **动态纹理生成**  

---

## 6. 总结

- 反应扩散系统通过 **局部反应 + 扩散** 生成图案  
- 使用 **mask** 可以将系统限制在容器内部  
- SVG 或任意矢量图都可以作为容器，实现精确控制  
- 可以结合动画或颜色映射，制作高质量数字艺术效果
