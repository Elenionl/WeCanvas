const main = {
  /**
     * 渲染块
     * @param {Object} params
     */
  drawBlock({
    text, width = 0, height, x, y, paddingLeft = 0, paddingRight = 0,
    borderWidth, backgroundColor, borderColor, borderRadius = 0, opacity = 1
  }) {
    // 判断是否块内有文字
    // 块的宽度
    const blockWidth = this.calculateBlockWidth(width, text, paddingLeft, paddingRight)
    let textX = 0
    let textY = 0
    const textAlign = text.textAlign || 'left'
    textY = y
    if (textAlign === 'left') {
      // 如果是右对齐，那x轴在块的最左边
      textX = x + paddingLeft
    } else if (textAlign === 'center') {
      textX = blockWidth / 2 + x
    } else {
      textX = x + blockWidth - paddingRight
    }
    if (backgroundColor) {
      // 画面
      this.ctx.save()
      this.ctx.setGlobalAlpha(opacity)
      this.ctx.setFillStyle(backgroundColor)
      if (borderRadius > 0) {
        // 画圆角矩形
        this._drawRadiusRect(x, y, blockWidth, height, borderRadius)
        this.ctx.fill()
      } else {
        this.ctx.fillRect(this.toPx(x), this.toPx(y), this.toPx(blockWidth), this.toPx(height))
      }
      this.ctx.restore()
    }
    if (borderWidth) {
      // 画线
      this.ctx.save()
      this.ctx.setGlobalAlpha(opacity)
      this.ctx.setStrokeStyle(borderColor)
      this.ctx.setLineWidth(this.toPx(borderWidth))
      if (borderRadius > 0) {
        // 画圆角矩形边框
        this._drawRadiusRect(x, y, blockWidth, height, borderRadius)
        this.ctx.stroke()
      } else {
        this.ctx.strokeRect(this.toPx(x), this.toPx(y), this.toPx(blockWidth), this.toPx(height))
      }
      this.ctx.restore()
    }

    if (text) {
      this.drawText(Object.assign(text, {x: textX, y: textY}))
    }
  },

  calculateBlockWidth(width, text, paddingLeft, paddingRight) {
    let blockWidth = width
    if (typeof text !== 'undefined') {
      // 如果有文字并且块的宽度小于文字宽度，块的宽度为 文字的宽度 + 内边距
      const textWidth = this._getTextWidth(typeof text.text === 'string' ? text : text.text)
      blockWidth = textWidth > width ? textWidth : width
      blockWidth += paddingLeft + paddingRight
    } else {
      blockWidth = width
    }
    return blockWidth
  },

  /**
     * 渲染文字
     * @param {Object} params
     */
  drawText(params) {
    const {
      x, y, baseLine, text,
    } = params
    if (Object.prototype.toString.call(text) === '[object Array]') {
      const preText = {x, y, baseLine}
      text.forEach(item => {
        preText.x += item.marginLeft || 0
        item.x = preText.x
        item.y = preText.y
        item.baseLine = preText.baseLine
        const textWidth = this._drawSingleText(item)
        preText.x += textWidth + (item.marginRight || 0) // 下一段字的x轴为上一段字x + 上一段字宽度
      })
    } else {
      this._drawSingleText(params)
    }
  },

  /**
     * 渲染图片
     * Hobby添加mode，默认为0为aspectFill，1为aspectFit
     */
  drawImage(data) {
    const {
      imgPath, x, y, w, h, sx, sy, sw, sh, borderRadius = 0, borderWidth = 0, borderColor
    } = data
    this.ctx.save()
    if (borderRadius > 0) {
      this.ctx.beginPath()
      this._drawRadiusRect(x, y, w, h, borderRadius)
      this.ctx.clip()
      this.ctx.drawImage(
        imgPath, this.toPx(sx), this.toPx(sy),
        this.toPx(sw), this.toPx(sh), this.toPx(x),
        this.toPx(y), this.toPx(w), this.toPx(h)
      )
      if (borderWidth > 0) {
        this.ctx.setStrokeStyle(borderColor)
        this.ctx.setLineWidth(this.toPx(borderWidth))
        this.ctx.stroke()
      }
    } else {
      this.ctx.drawImage(
        imgPath, this.toPx(sx),
        this.toPx(sy), this.toPx(sw), this.toPx(sh),
        this.toPx(x), this.toPx(y), this.toPx(w), this.toPx(h)
      )
    }
    this.ctx.restore()
  },
  /**
     * 渲染线
     * @param {*} param0
     */
  drawLine({
    startX, startY, endX, endY, color, width
  }) {
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.setStrokeStyle(color)
    this.ctx.setLineWidth(this.toPx(width))
    this.ctx.moveTo(this.toPx(startX), this.toPx(startY))
    this.ctx.lineTo(this.toPx(endX), this.toPx(endY))
    this.ctx.stroke()
    this.ctx.closePath()
    this.ctx.restore()
  },
  clear() {
    this.drawArr = []
    if (!this.imageCache) {
      this.imageCache = {}
    }
  },
  downloadResource(images = []) {
    const drawList = images.map((image, index) => this._downloadImageAndInfo(image, index))
    return Promise.all(drawList)
  },
  initCanvas(w, h, debug) {
    return new Promise((resolve) => {
      this.setData({
        pxWidth: this.toPx(w),
        pxHeight: this.toPx(h),
        debug,
      }, resolve)
    })
  }
}
const handle = {
  /**
     * 画圆角矩形
     */
  _drawRadiusRect(x, y, w, h, r) {
    const br = r / 2
    this.ctx.beginPath()
    this.ctx.moveTo(this.toPx(x + br), this.toPx(y)) // 移动到左上角的点
    this.ctx.lineTo(this.toPx(x + w - br), this.toPx(y))
    this.ctx.arc(
      this.toPx(x + w - br), this.toPx(y + br),
      this.toPx(br), 2 * Math.PI * (3 / 4), 2 * Math.PI * (4 / 4)
    )
    this.ctx.lineTo(this.toPx(x + w), this.toPx(y + h - br))
    this.ctx.arc(
      this.toPx(x + w - br), this.toPx(y + h - br),
      this.toPx(br), 0, 2 * Math.PI * (1 / 4)
    )
    this.ctx.lineTo(this.toPx(x + br), this.toPx(y + h))
    this.ctx.arc(
      this.toPx(x + br), this.toPx(y + h - br),
      this.toPx(br), 2 * Math.PI * (1 / 4), 2 * Math.PI * (2 / 4)
    )
    this.ctx.lineTo(this.toPx(x), this.toPx(y + br))
    this.ctx.arc(
      this.toPx(x + br), this.toPx(y + br),
      this.toPx(br), 2 * Math.PI * (2 / 4), 2 * Math.PI * (3 / 4)
    )
  },
  /**
     * 计算文本长度
     * @param {Array|Object}} text 数组 或者 对象
     */
  _getTextWidth(text) {
    let texts = []
    if (Object.prototype.toString.call(text) === '[object Object]') {
      texts.push(text)
    } else {
      texts = text
    }
    let width = 0
    texts.forEach(({
      fontSize, text, marginLeft = 0, marginRight = 0
    }) => {
      this.ctx.setFontSize(this.toPx(fontSize))
      width += this.ctx.measureText(text).width + marginLeft + marginRight
    })
    return this.toRpx(width)
  },
  /**
     * 渲染一段文字
     */
  _drawSingleText({
    x = 0, y = 0, fontSize, color, baseLine = 'middle', textAlign = 'left', text, opacity = 1, textDecoration = 'none',
    width, lineNum = 1, lineHeight = 0, fontWeight = 'normal', fontStyle = 'normal', fontFamily = 'sans-serif'
  }) {
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.font = fontStyle + ' ' + fontWeight + ' ' + this.toPx(fontSize, true) + 'px ' + fontFamily
    this.ctx.setGlobalAlpha(opacity)
    // this.ctx.setFontSize(this.toPx(fontSize));
    this.ctx.setFillStyle(color)
    this.ctx.setTextBaseline(baseLine)
    this.ctx.setTextAlign(textAlign)
    let textWidth = this.toRpx(this.ctx.measureText(text).width)
    const textArr = []
    if (textWidth > width) {
      // 文本宽度 大于 渲染宽度
      const unitTextWidth = +(textWidth / text.length).toFixed(2)
      const unitLineNum = parseInt(width / unitTextWidth, 10) // 一行文本数量
      for (let i = 0; i <= text.length; i += unitLineNum) { // 将文字转为数组，一行文字一个元素
        const resText = text.slice(i, i + unitLineNum)
        if (resText) {
          textArr.push(resText)
        }
        if (textArr.length === lineNum) {
          break
        }
      }
      if (textArr.length * unitLineNum < text.length) {
        const moreTextWidth = this.ctx.measureText('...').width
        const moreTextNum = Math.ceil(moreTextWidth / unitTextWidth)
        const reg = new RegExp(`.{${moreTextNum}}$`)
        textArr[textArr.length - 1] = textArr[textArr.length - 1].replace(reg, '...')
      }
      textWidth = width
    } else {
      textArr.push(text)
    }
    textArr.forEach((item, index) => {
      const realLineHeight = lineHeight || fontSize
      let yPosition = y + realLineHeight * index
      if (baseLine === 'bottom') {
        yPosition += realLineHeight
      } else if (baseLine === 'middle') {
        yPosition += realLineHeight / 2
      }
      let xPosition = x
      if (textAlign === 'left') {
        xPosition = x
      } else if (textAlign === 'center') {
        xPosition = x + width / 2
      } else if (textAlign === 'right') {
        xPosition = x + width
      }
      this.ctx.fillText(
        item, this.toPx(xPosition),
        this.toPx(yPosition)
      )
      // textDecoration
      if (textDecoration === 'line-through') {
      // 目前只支持贯穿线
        let lineY = yPosition
        if (baseLine === 'bottom') {
          lineY -= fontSize / 1.6
        } else if (baseLine === 'top') {
          lineY += fontSize / 1.6
        }
        this.ctx.save()
        this.ctx.moveTo(this.toPx(x), this.toPx(lineY))
        this.ctx.lineTo(this.toPx(x) + this.toPx(textWidth), this.toPx(lineY))
        this.ctx.setLineWidth(this.toPx(fontSize / 10.0))
        this.ctx.setStrokeStyle(color)
        this.ctx.stroke()
        this.ctx.restore()
      }
    })

    this.ctx.restore()
    return textWidth
  },
}
const helper = {
  /**
      * 下载图片并获取图片信息
      */
  _downloadImageAndInfo(image, index) {
    this.clear()
    const {
      x, y, src, zIndex, key
    } = image
    let cacheKey
    if (typeof src === 'string') {
      cacheKey = src
    } else {
      cacheKey = key
    }
    if (this.imageCache[cacheKey] && this.imageCache[cacheKey].imagePath) {
      return new Promise((resolve) => {
        resolve(this.imageCache[cacheKey])
      })
    }
    // 下载图片
    return this._downImage(src, index)
    // 获取图片信息
      .then(imgPath => this._getImageInfo(imgPath, index))
      .then(({imgPath, imgInfo}) => {
        // 根据画布的宽高计算出图片绘制的大小，这里会保证图片绘制不变形
        let sx = 0
        let sy = 0
        let sw = this.toRpx(imgInfo.width)
        let sh = this.toRpx(imgInfo.height)
        let dx = x
        let dy = y
        let dw = image.width
        let dh = image.height
        const borderRadius = image.borderRadius || 0
        const mode = image.mode || 'aspectFit'
        if (mode === 'aspectFit') {
          if (sw / sh <= dw / dh) {
            sy = (sh - ((sw / dw) * dh)) / 2
            sh -= (sy * 2)
          } else {
            sx = (sw - ((sh / dh) * dw)) / 2
            sw -= (sx * 2)
          }
        } else if (mode === 'aspectFill') {
          if (sw / sh <= dw / dh) {
            const tw = (sw / sh) * dh
            dx += (dw - tw) / 2
            dw = tw
          } else {
            const th = (sh / sw) * dw
            dy += (dh - th) / 2
            dh = th
          }
        }
        const imageConfig = {
          type: 'image',
          borderRadius,
          borderWidth: image.borderWidth,
          borderColor: image.borderColor,
          zIndex: typeof zIndex !== 'undefined' ? zIndex : index,
          imgPath,
          sx,
          sy,
          sw,
          sh,
          x: dx,
          y: dy,
          w: dw,
          h: dh,
        }
        this.imageCache[cacheKey] = imageConfig
        return imageConfig
      })
  },
  /**
     * 下载图片资源
     * @param {*} source
     */
  _downImage(source) {
    if (typeof source === 'object') {
      return source
    } else if (typeof source === 'function') {
      return source()
    } else {
      return new Promise((resolve, reject) => {
        if (/^http/.test(source) && !new RegExp(wx.env.USER_DATA_PATH).test(source)) {
          wx.downloadFile({
            url: this._mapHttpToHttps(source),
            success: (res) => {
              if (res.statusCode === 200) {
                resolve(res.tempFilePath)
              } else {
                reject(res.errMsg)
              }
            },
            fail(err) {
              reject(err)
            },
          })
        } else {
          // 支持本地地址
          resolve(source)
        }
      })
    }
  },
  /**
     * 获取图片信息
     * @param {*} imgPath
     * @param {*} index
     */
  _getImageInfo(imgPath, index) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: imgPath,
        success(res) {
          resolve({imgPath, imgInfo: res, index})
        },
        fail(err) {
          reject(err)
        },
      })
    })
  },
  toPx(rpx, int) {
    if (int) {
      return parseInt(rpx * this.factor, 10)
    }
    return rpx * this.factor
  },
  toRpx(px, int) {
    if (int) {
      return parseInt(px / this.factor, 10)
    }
    return px / this.factor
  },
  /**
     * 将http转为https
     * @param {String}} rawUrl 图片资源url
     */
  _mapHttpToHttps(rawUrl) {
    if (rawUrl.indexOf(':') < 0) {
      return rawUrl
    }
    const urlComponent = rawUrl.split(':')
    if (urlComponent.length === 2) {
      if (urlComponent[0] === 'http') {
        urlComponent[0] = 'https'
        return `${urlComponent[0]}:${urlComponent[1]}`
      }
    }
    return rawUrl
  },
}
Component({
  properties: {
    config: {
      type: Object,
      observer: 'didSetConfig',
    }
  },
  data: {
    delayId: undefined
  },
  lifetimes: {
    attached() {
      this.data.delayId = undefined
    },
    detached() {
      if (this.data.delayId) {
        clearTimeout(this.data.delayId)
      }
    },
  },
  created() {
    const sysInfo = wx.getSystemInfoSync()
    const screenWidth = sysInfo.screenWidth
    this.factor = screenWidth / 750
  },
  methods: Object.assign({
    didSetConfig(newValue) {
      this.create(newValue)
    },

    /**
     * 计算画布的高度
     * @param {*} config
     */
    getHeight(config) {
      const getTextHeight = (text) => {
        const fontHeight = text.lineHeight || text.fontSize
        let height = 0
        if (text.baseLine === 'top') {
          height = fontHeight
        } else if (text.baseLine === 'middle') {
          height = fontHeight / 2
        } else {
          height = 0
        }
        return height
      }
      const heightArr = [];
      (config.blocks || []).forEach((item) => {
        heightArr.push(item.y + item.height)
      });
      (config.texts || []).forEach((item) => {
        let height
        if (Object.prototype.toString.call(item.text) === '[object Array]') {
          item.text.forEach((i) => {
            height = getTextHeight({i, baseLine: item.baseLine})
            heightArr.push(item.y + height)
          })
        } else {
          height = getTextHeight(item)
          heightArr.push(item.y + height)
        }
      });
      (config.images || []).forEach((item) => {
        heightArr.push(item.y + item.height)
      });
      (config.lines || []).forEach((item) => {
        heightArr.push(item.startY)
        heightArr.push(item.endY)
      })
      const sortRes = heightArr.sort((a, b) => b - a)
      let canvasHeight = 0
      if (sortRes.length > 0) {
        canvasHeight = sortRes[0]
      }
      if (config.height < canvasHeight || !config.height) {
        return canvasHeight
      } else {
        return config.height
      }
    },
    create(config) {
      this.ctx = wx.createCanvasContext('canvasid', this)
      const height = this.getHeight(config)
      this.initCanvas(config.width, height, config.debug)
        .then(() => this.downloadResource(config.images))
        .then((images) => {
          // 设置画布底色
          if (config.backgroundColor) {
            this.ctx.save()
            this.ctx.setFillStyle(config.backgroundColor)
            this.ctx.fillRect(0, 0, this.toPx(config.width), this.toPx(height))
            this.ctx.restore()
          }
          const {
            texts = [], blocks = [], lines = []
          } = config
          const queue = this.drawArr
            .concat(texts.map((item) => {
              item.type = 'text'
              item.zIndex = item.zIndex || 0
              return item
            }))
            .concat(images.map((item) => {
              item.type = 'image'
              item.zIndex = item.zIndex || 0
              return item
            }))
            .concat(blocks.map((item) => {
              item.type = 'block'
              item.zIndex = item.zIndex || 0
              return item
            }))
            .concat(lines.map((item) => {
              item.type = 'line'
              item.zIndex = item.zIndex || 0
              return item
            }))
          // 按照顺序排序
          queue.sort((a, b) => a.zIndex - b.zIndex)

          queue.forEach((item) => {
            if (item.type === 'image') {
              this.drawImage(item)
            } else if (item.type === 'text') {
              this.drawText(item)
            } else if (item.type === 'block') {
              this.drawBlock(item)
            } else if (item.type === 'line') {
              this.drawLine(item)
            }
          })

          const res = wx.getSystemInfoSync()
          const platform = res.platform
          let time = 0
          if (platform === 'android') {
            // 在安卓平台，经测试发现如果海报过于复杂在转换时需要做延时，要不然样式会错乱
            time = 300
          }
          this.ctx.draw(false, () => {
            this.data.delayId = setTimeout(() => {
              wx.canvasToTempFilePath({
                canvasId: 'canvasid',
                success: (res) => {
                  this.triggerEvent('success', res.tempFilePath)
                },
                fail: (err) => {
                  this.triggerEvent('fail', err)
                },
              }, this)
            }, time)
          })
          return null
        })
        .catch((err) => {
          wx.showToast({icon: 'none', title: err.errMsg || '生成失败'})
          console.error(err)
        })
    },
  }, main, handle, helper),
})
