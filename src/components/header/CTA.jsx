import React from 'react'
import {Link} from 'react-router-dom';

const CTA = () => {
  return (
    <div className='cta'>
      <Link to="/login" className='btn btn-primary'>Get Started</Link>
    </div>
  );
}

export default CTA;