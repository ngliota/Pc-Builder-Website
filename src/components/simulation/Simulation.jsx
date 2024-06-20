import React, { useState, useEffect, useContext } from 'react';
import './simulation.css';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { BsCpuFill, BsGpuCard, BsFillMotherboardFill, BsDeviceSsdFill, BsDeviceHddFill } from "react-icons/bs";
import { CgSmartphoneRam } from "react-icons/cg";
import { FiMonitor } from "react-icons/fi";
import { LuPcCase } from "react-icons/lu";
import { AuthContext } from '../../contexts/AuthContext';

const cpuOptions = [
    { value: '', label: 'Select CPU', price: 0 },
    { value: 'cpu1', label: 'Intel Core i9-13900K', socket: 'LGA1700', price: 9000000 },
    { value: 'cpu2', label: 'AMD Ryzen 9 7950X', socket: 'AM5', price: 10500000 },
    { value: 'cpu3', label: 'Intel Core i7-13700K', socket: 'LGA1700', price: 6500000 },
    { value: 'cpu4', label: 'AMD Ryzen 7 7700X', socket: 'AM5', price: 6000000 },
];

const gpuOptions = [
    { value: '', label: 'Select GPU', price: 0 },
    { value: 'gpu1', label: 'NVIDIA GeForce RTX 4090', price: 24000000 },
    { value: 'gpu2', label: 'AMD Radeon RX 7900 XTX', price: 15000000 },
    { value: 'gpu3', label: 'NVIDIA GeForce RTX 4080', price: 18000000 },
    { value: 'gpu4', label: 'AMD Radeon RX 6800 XT', price: 10000000 },
];

const motherboardOptions = [
    { value: '', label: 'Select Motherboard', price: 0 },
    { value: 'mobo1', label: 'ASUS ROG Maximus Z790 Hero', socket: 'LGA1700', price: 9000000 },
    { value: 'mobo2', label: 'MSI MPG X670E Carbon WiFi', socket: 'AM5', price: 7500000 },
    { value: 'mobo3', label: 'Gigabyte X670E Aorus Master', socket: 'AM5', price: 7000000 },
    { value: 'mobo4', label: 'ASUS ROG Strix Z690-E Gaming WiFi', socket: 'LGA1700', price: 6500000 },
];

const ramOptions = [
    { value: '', label: 'Select RAM', price: 0 },
    { value: 'ram1', label: 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5-6000', price: 4500000 },
    { value: 'ram2', label: 'Corsair Vengeance RGB RT 32GB (2x16GB) DDR5-5600', price: 4000000 },
    { value: 'ram3', label: 'Kingston Fury Beast 32GB (2x16GB) DDR5-5600', price: 3500000 },
    { value: 'ram4', label: 'G.Skill Ripjaws V 16GB (2x8GB) DDR4-3600', price: 1500000 },
];

const ssdOptions = [
    { value: '', label: 'Select SSD', price: 0 },
    { value: 'ssd1', label: 'Samsung 980 Pro 2TB NVMe M.2', price: 5000000 },
    { value: 'ssd2', label: 'WD Black SN850 1TB NVMe M.2', price: 3000000 },
    { value: 'ssd3', label: 'Crucial P5 Plus 1TB NVMe M.2', price: 2500000 },
    { value: 'ssd4', label: 'Seagate FireCuda 520 1TB NVMe M.2', price: 2000000 },
];

const hddOptions = [
    { value: '', label: 'Select HDD', price: 0 },
    { value: 'hdd1', label: 'Seagate BarraCuda 4TB 3.5"', price: 1500000 },
    { value: 'hdd2', label: 'Western Digital Blue 2TB 3.5"', price: 1000000 },
    { value: 'hdd3', label: 'Toshiba P300 1TB 3.5"', price: 750000 },
    { value: 'hdd4', label: 'Hitachi Ultrastar 8TB 3.5"', price: 2000000 },
];

const caseOptions = [
    { value: '', label: 'Select Case', price: 0 },
    { value: 'case1', label: 'Lian Li O11 Dynamic EVO', price: 2500000 },
    { value: 'case2', label: 'Corsair 4000D Airflow', price: 1500000 },
    { value: 'case3', label: 'NZXT H510 Flow', price: 1250000 },
    { value: 'case4', label: 'Fractal Design Meshify C', price: 1000000 },
];

const monitorOptions = [
    { value: '', label: 'Select Monitor', price: 0 },
    { value: 'monitor1', label: 'LG UltraGear 27GN950-B 27" 4K 144Hz', price: 10000000 },
    { value: 'monitor2', label: 'Samsung Odyssey G7 27" 1440p 240Hz', price: 8000000 },
    { value: 'monitor3', label: 'ASUS TUF Gaming VG27AQ 27" 1440p 165Hz', price: 6000000 },
    { value: 'monitor4', label: 'Dell S2721DGFA 27" 1440p 165Hz', price: 5000000 },
];

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

const Simulation = () => {
    const { userid } = useContext(AuthContext);
    const [selectedCpu, setSelectedCpu] = useState('');
    const [selectedMotherboard, setSelectedMotherboard] = useState('');
    const [selectedGpu, setSelectedGpu] = useState('');
    const [selectedRam, setSelectedRam] = useState('');
    const [selectedSsd, setSelectedSsd] = useState('');
    const [selectedHdd, setSelectedHdd] = useState('');
    const [selectedCase, setSelectedCase] = useState('');
    const [selectedMonitor, setSelectedMonitor] = useState('');
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const { simulationId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (simulationId) {
            const fetchSimulationDetails = async () => {
                try {
                    const response = await axios.get(`https://backend.agungyzs.site/api/get-simulation/${simulationId}`, { withCredentials: true });
                    const data = response.data;
                    setName(data.name);
                    setPhoneNumber(data.phoneNumber);
                    setSelectedCpu(data.cpu);
                    setSelectedMotherboard(data.motherboard);
                    setSelectedGpu(data.gpu);
                    setSelectedRam(data.ram);
                    setSelectedSsd(data.ssd);
                    setSelectedHdd(data.hdd);
                    setSelectedCase(data.pcCase);
                    setSelectedMonitor(data.monitor);
                } catch (error) {
                    console.error('Error fetching simulation details:', error);
                }
            };

            fetchSimulationDetails();
        }
    }, [simulationId]);

    useEffect(() => {
        setSelectedMotherboard('');
    }, [selectedCpu]);

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

    const handleReset = () => {
        setSelectedCpu('');
        setSelectedMotherboard('');
        setSelectedGpu('');
        setSelectedRam('');
        setSelectedSsd('');
        setSelectedHdd('');
        setSelectedCase('');
        setSelectedMonitor('');
        setName('');
        setPhoneNumber('');
    };

    const validatePhoneNumber = (phoneNumber) => {
        const phoneNumberRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
        return phoneNumberRegex.test(phoneNumber);
    };

    const handleSaveOrUpdate = async () => {
        if (!selectedMotherboard || !name || !phoneNumber) {
            alert("Please fill in all fields.");
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            alert("Please enter a valid phone number.");
            return;
        }

        const selectedComponents = {
            simulationid: simulationId || `SIM-${uuidv4()}`,
            userid,
            name,
            phoneNumber,
            cpu: selectedCpu,
            motherboard: selectedMotherboard,
            gpu: selectedGpu,
            ram: selectedRam,
            ssd: selectedSsd,
            hdd: selectedHdd,
            pcCase: selectedCase,
            monitor: selectedMonitor,
        };

        try {
            let response;
            if (simulationId) {
                response = await axios.put(`https://backend.agungyzs.site/api/update-simulation/${simulationId}`, selectedComponents, { withCredentials: true });
            } else {
                response = await axios.post('https://backend.agungyzs.site/api/save-simulation', selectedComponents, { withCredentials: true });
            }
            if (response.status === 200) {
                handleReset();
                alert('Simulation data saved successfully!');
                navigate('/history'); // Redirect to history page after saving
            } else {
                alert('Failed to save simulation data. Please try again later.');
            }
        } catch (error) {
            alert('Error saving simulation data. Please try again later.');
        }
    };

    return (
        <section id='experience'>
            <h5>PC Build Simulation</h5>
            <h2>{simulationId ? 'Edit Your Components' : 'Select Your Components'}</h2>

            <div className='container experience__container'>
                <div className='experience__frontend'>
                    <div className='experience__user-input'>
                        <div>
                            <label htmlFor="name">Name:</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="phoneNumber">Phone Number:</label>
                            <input
                                id="phoneNumber"
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                    </div>
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
                                    name="cpu"
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
                                    name="motherboard"
                                >
                                    <option value=''>Select Motherboard - Rp 0</option>
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
                                    name="ram"
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
                                    name="gpu"
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
                                    name="ssd"
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
                                    name="hdd"
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
                                    name="pcCase"
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
                                    name="monitor"
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
                    <div className="experience__footer">
                        <button className="btn btn-reset" onClick={handleReset}>Reset</button>
                        <button className="btn btn-save" onClick={handleSaveOrUpdate} disabled={selectedMotherboard === ''}>
                            {simulationId ? 'Update' : 'Save'}
                        </button>
                    </div>
                    <p>Total Price: {formatRupiah(getTotalPrice())}</p>
                </div>
            </div>
        </section>
    );
}

export default Simulation;
