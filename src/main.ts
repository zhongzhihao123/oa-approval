import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'

let app: any = null

function render(props: any = {}) {
  const { container } = props
  app = createApp(App)
  app.use(router)
  app.use(ElementPlus)
  app.mount(container ? container.querySelector('#app') : '#app')
}

renderWithQiankun({
  mount(props) { render(props) },
  bootstrap() {},
  unmount() {
    if (app) {
      app.unmount()
      app = null
    }
  },
  update(props: any) {}
})

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
