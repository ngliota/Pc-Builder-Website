import React, { useState } from 'react';
import './simulation.css';
import { BsCpuFill } from "react-icons/bs";
import { BsGpuCard } from "react-icons/bs";
import { BsFillMotherboardFill } from "react-icons/bs";
import { LuPcCase } from "react-icons/lu";
import { BsDeviceSsdFill } from "react-icons/bs";
import { BsDeviceHddFill } from "react-icons/bs";
import { CgSmartphoneRam } from "react-icons/cg";
import { FiMonitor } from "react-icons/fi";

const cpuOptions = [
  { value: '', label: 'Pilih CPU', price: 0 },
  { value: 'cpu1', label: 'Intel Core i9-13900K', socket: 'LGA1700', price: 9000000 },
  { value: 'cpu2', label: 'AMD Ryzen 9 7950X', socket: 'AM5', price: 10500000 },
  { value: 'cpu3', label: 'Intel Core i7-13700K', socket: 'LGA1700', price: 6500000 },
  { value: 'cpu4', label: 'AMD Ryzen 7 7700X', socket: 'AM5', price: 6000000 },
  // Add more CPU options as needed
];

const gpuOptions = [
  { value: '', label: 'Pilih GPU', price: 0 },
  { value: 'gpu1', label: 'NVIDIA GeForce RTX 4090', price: 24000000 },
  { value: 'gpu2', label: 'AMD Radeon RX 7900 XTX', price: 15000000 },
  { value: 'gpu3', label: 'NVIDIA GeForce RTX 4080', price: 18000000 },
  { value: 'gpu4', label: 'AMD Radeon RX 6800 XT', price: 10000000 },
  // Add more GPU options as needed
];

const motherboardOptions = [
  { value: '', label: 'Pilih Motherboard', price: 0 },
  { value: 'mobo1', label: 'ASUS ROG Maximus Z790 Hero', socket: 'LGA1700', price: 9000000 },
  { value: 'mobo2', label: 'MSI MPG X670E Carbon WiFi', socket: 'AM5', price: 7500000 },
  { value: 'mobo3', label: 'Gigabyte X670E Aorus Master', socket: 'AM5', price: 7000000 },
  { value: 'mobo4', label: 'ASUS ROG Strix Z690-E Gaming WiFi', socket: 'LGA1700', price: 6500000 },
  // Add more Motherboard options as needed
];

const ramOptions = [
  { value: '', label: 'Pilih RAM', price: 0 },
  { value: 'ram1', label: 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5-6000', price: 4500000 },
  { value: 'ram2', label: 'Corsair Vengeance RGB RT 32GB (2x16GB) DDR5-5600', price: 4000000 },
  { value: 'ram3', label: 'Kingston Fury Beast 32GB (2x16GB) DDR5-5600', price: 3500000 },
  { value: 'ram4', label: 'G.Skill Ripjaws V 16GB (2x8GB) DDR4-3600', price: 1500000 },
  // Add more RAM options as needed
];

const ssdOptions = [
  { value: '', label: 'Pilih SSD', price: 0 },
  { value: 'ssd1', label: 'Samsung 980 Pro 2TB NVMe M.2', price: 5000000 },
  { value: 'ssd2', label: 'WD Black SN850 1TB NVMe M.2', price: 3000000 },
  { value: 'ssd3', label: 'Crucial P5 Plus 1TB NVMe M.2', price: 2500000 },
  { value: 'ssd4', label: 'Seagate FireCuda 520 1TB NVMe M.2', price: 2000000 },
  // Add more SSD options as needed
];

const hddOptions = [
  { value: '', label: 'Pilih HDD', price: 0 },
  { value: 'hdd1', label: 'Seagate BarraCuda 4TB 3.5"', price: 1500000 },
  { value: 'hdd2', label: 'Western Digital Blue 2TB 3.5"', price: 1000000 },
  { value: 'hdd3', label: 'Toshiba P300 1TB 3.5"', price: 750000 },
  { value: 'hdd4', label: 'Hitachi Ultrastar 8TB 3.5"', price: 2000000 },
  // Add more HDD options as needed
];

const caseOptions = [
  { value: '', label: 'Pilih Case', price: 0 },
  { value: 'case1', label: 'Lian Li O11 Dynamic EVO', price: 2500000 },
  { value: 'case2', label: 'Corsair 4000D Airflow', price: 1500000 },
  { value: 'case3', label: 'NZXT H510 Flow', price: 1250000 },
  { value: 'case4', label: 'Fractal Design Meshify C', price: 1000000 },
  // Add more Case options as needed
];

const monitorOptions = [
  { value: '', label: 'Pilih Monitor', price: 0 },
  { value: 'monitor1', label: 'LG UltraGear 27GN950-B 27" 4K 144Hz', price: 10000000 },
  { value: 'monitor2', label: 'Samsung Odyssey G7 27" 1440p 240Hz', price: 8000000 },
  { value: 'monitor3', label: 'ASUS TUF Gaming VG27AQ 27" 1440p 165Hz', price: 6000000 },
  { value: 'monitor4', label: 'Dell S2721DGFA 27" 1440p 165Hz', price: 5000000 },
  // Add more Monitor options as needed
];

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

const Simulation = () => {
  const [selectedCpu, setSelectedCpu] = useState('');
  const [selectedMotherboard, setSelectedMotherboard] = useState('');
  const [selectedGpu, setSelectedGpu] = useState('');
  const [selectedRam, setSelectedRam] = useState('');
  const [selectedSsd, setSelectedSsd] = useState('');
  const [selectedHdd, setSelectedHdd] = useState('');
  const [selectedCase, setSelectedCase] = useState('');
  const [selectedMonitor, setSelectedMonitor] = useState('');

  const getCompatibleMotherboards = () => {
    const selectedCpuSocket = cpuOptions.find((option) => option.value === selectedCpu)?.socket;
    return motherboardOptions.filter((option) => option.socket === selectedCpuSocket);
  };

  const getTotalPrice = () => {
    const cpu = cpuOptions.find((option) => option.value === selectedCpu);
    const motherboard = motherboardOptions.find((option) => option.value === selectedMotherboard);
    const gpu = gpuOptions.find((option) => option.value === selectedGpu);
    const ram = ramOptions.find((option) => option.value === selectedRam);
    const ssd = ssdOptions.find((option) => option.value === selectedSsd);
    const hdd = hddOptions.find((option) => option.value === selectedHdd);
    const pcCase = caseOptions.find((option) => option.value === selectedCase);
    const monitor = monitorOptions.find((option) => option.value === selectedMonitor);

    return (
      (cpu?.price || 0) +
      (motherboard?.price || 0) +
      (gpu?.price || 0) +
      (ram?.price || 0) +
      (ssd?.price || 0) +
      (hdd?.price || 0) +
      (pcCase?.price || 0) +
      (monitor?.price || 0)
    );
  };

  return (
    <section id='experience'>
      <h5>Simulasi Rakit PC</h5>
      <h2>Pilih Komponen Anda</h2>

      <div className='container experience__container'>
        <div className='experience__frontend'>
          <div className='experience__content'>
            <div className='experience__dropdown'>
              <div className='experience__dropdown-header'>
                <BsCpuFill className='experience__dropdown-icon' />
                <h3>CPU</h3>
              </div>
              <div>
                <select
                  value={selectedCpu}
                  onChange={(e) => setSelectedCpu(e.target.value)}
                >
                  {cpuOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {formatRupiah(option.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='experience__dropdown'>
              <div className='experience__dropdown-header'>
                <BsFillMotherboardFill className='experience__dropdown-icon' />
                <h3>Motherboard</h3>
              </div>
              <div>
                <select
                  value={selectedMotherboard}
                  onChange={(e) => setSelectedMotherboard(e.target.value)}
                >
                  {getCompatibleMotherboards().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {formatRupiah(option.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='experience__dropdown'>
              <div className='experience__dropdown-header'>
                <CgSmartphoneRam className='experience__dropdown-icon' />
                <h3>RAM</h3>
              </div>
              <div>
                <select
                  value={selectedRam}
                  onChange={(e) => setSelectedRam(e.target.value)}
                >
                  {ramOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {formatRupiah(option.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='experience__dropdown'>
              <div className='experience__dropdown-header'>
                <BsGpuCard className='experience__dropdown-icon' />
                <h3>GPU</h3>
              </div>
              <div>
                <select
                  value={selectedGpu}
                  onChange={(e) => setSelectedGpu(e.target.value)}
                >
                  {gpuOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {formatRupiah(option.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='experience__dropdown'>
              <div className='experience__dropdown-header'>
                <BsDeviceSsdFill className='experience__dropdown-icon' />
                <h3>SSD</h3>
              </div>
              <div>
                <select
                  value={selectedSsd}
                  onChange={(e) => setSelectedSsd(e.target.value)}
                >
                  {ssdOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {formatRupiah(option.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='experience__dropdown'>
              <div className='experience__dropdown-header'>
                <BsDeviceHddFill className='experience__dropdown-icon' />
                <h3>HDD</h3>
              </div>
              <div>
                <select
                  value={selectedHdd}
                  onChange={(e) => setSelectedHdd(e.target.value)}
                >
                  {hddOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {formatRupiah(option.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='experience__dropdown'>
              <div className='experience__dropdown-header'>
                <LuPcCase className='experience__dropdown-icon' />
                <h3>Case</h3>
              </div>
              <div>
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                >
                  {caseOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {formatRupiah(option.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='experience__dropdown'>
              <div className='experience__dropdown-header'>
                <FiMonitor className='experience__dropdown-icon' />
                <h3>Monitor</h3>
              </div>
              <div>
                <select
                  value={selectedMonitor}
                  onChange={(e) => setSelectedMonitor(e.target.value)}
                >
                  {monitorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {formatRupiah(option.price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <p>Total Price: {formatRupiah(getTotalPrice())}</p>
        </div>
      </div>
    </section>
  );
}

export default Simulation;
