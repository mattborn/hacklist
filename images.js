import { createNoise2D } from 'https://cdn.skypack.dev/simplex-noise'

export function generateProjectImage(title, width = 400, height = 300) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height

  // Generate colors from title
  const hash = hashString(title)
  const { color1, color2 } = generateColors(hash)

  // Create gradient
  const imageData = ctx.createImageData(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gradientPos = (x + y) / (width + height)
      const i = (y * width + x) * 4
      imageData.data[i] = color1.r + (color2.r - color1.r) * gradientPos
      imageData.data[i + 1] = color1.g + (color2.g - color1.g) * gradientPos
      imageData.data[i + 2] = color1.b + (color2.b - color1.b) * gradientPos
      imageData.data[i + 3] = 255
    }
  }

  // Add film grain
  addGrain(imageData, imageData, { x: 0, y: 0, width, height }, 1600, 0.1)

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// Helpers
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash = hash & hash
  }
  return hash
}

function generateColors(hash) {
  return {
    color1: {
      r: (hash & 0xff) % 256,
      g: ((hash >> 8) & 0xff) % 256,
      b: ((hash >> 16) & 0xff) % 256,
    },
    color2: {
      r: ((hash >> 4) & 0xff) % 256,
      g: ((hash >> 12) & 0xff) % 256,
      b: ((hash >> 20) & 0xff) % 256,
    },
  }
}

// github.com/jwagner/analog-film-emulator/blob/master/src/image-processing.js
function addGrain(out, image, slice, scale, intensity) {
  let noise2D = createNoise2D()
  let od = out.data,
    id = image.data,
    w = image.width,
    h = image.height,
    ox = slice.x,
    oy = slice.y,
    d = Math.min(slice.width, slice.height)

  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      let i = (y * w + x) * 4,
        l = (id[i] + id[i + 1] + id[i + 2]) / 768 - 0.5,
        rx = x + ox,
        ry = y + oy,
        noise =
          (noise2D((rx / d) * scale, (ry / d) * scale) +
            noise2D(((rx / d) * scale) / 2, ((ry / d) * scale) / 2) * 0.25 +
            noise2D(((rx / d) * scale) / 4, ((ry / d) * scale) / 4)) *
          0.5
      noise *= 1 - l * l * 2
      noise *= intensity * 255
      od[i] = id[i] + noise
      od[i + 1] = id[i + 1] + noise
      od[i + 2] = id[i + 2] + noise
    }
  }
}
