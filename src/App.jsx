import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import router from './Routes/router'
import {RouterProvider} from 'react-router-dom';
function App() {

  return (
    <>
     <RouterProvider router={router}></RouterProvider>
    </>
  )
}

export default App
