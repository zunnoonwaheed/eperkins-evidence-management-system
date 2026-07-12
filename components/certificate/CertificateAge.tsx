'use client';

import { useEffect, useState } from 'react';

interface CertificateAgeProps {
  signedDateISO: string;
}

export default function CertificateAge({ signedDateISO }: CertificateAgeProps) {
  const [age, setAge] = useState('Calculating...');

  useEffect(() => {
    const calculateAge = () => {
      const signedDate = new Date(signedDateISO);
      const now = new Date();
      const diff = now.getTime() - signedDate.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setAge(`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
    };

    calculateAge();
    const interval = setInterval(calculateAge, 1000);

    return () => clearInterval(interval);
  }, [signedDateISO]);

  return <>{age}</>;
}
