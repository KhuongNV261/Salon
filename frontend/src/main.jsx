import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import App from './App'
import 'antd/dist/reset.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ConfigProvider locale={viVN} theme={{
      token: {
        colorPrimary: '#667eea',
        borderRadius: 8,
        fontFamily: "'Inter', sans-serif"
      }
    }}>
      <App />
    </ConfigProvider>
  </BrowserRouter>
)
