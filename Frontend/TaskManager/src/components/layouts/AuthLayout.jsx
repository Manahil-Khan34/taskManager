import React from 'react'
import UI_IMG from "../../assets/images/side img.png";

const AuthLayout = ({  children }) => {
  return <div className='flex scroll-m-0'>
    <div className='w-screen h-screen md:w-[60vw] px-12 pt-8 pb-12'>
        <h2 className='text-lg font-medium text-black'>Task Manager</h2>
        {children}
    </div>

    <div className='hidden md:flex'>
        <img src={UI_IMG} className=' w-150 h-148'  />
    </div>

  </div>
};

export default AuthLayout

// hidden md:flex w-[40vw] h-screen items-center justify-centerbg-blue-50 bg-[url("/bg-img.png")] bg-no-repeat bg-center overflow-hidden p-8
