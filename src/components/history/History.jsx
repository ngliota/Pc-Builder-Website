import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './history.css';
import { AuthContext } from '../../contexts/AuthContext';


const options = {
  cpuOptions: [
    { value: '', label: 'Select CPU', price: 0 },
    { value: 'cpu1', label: 'Intel Core i9-13900K', socket: 'LGA1700', price: 9000000 },
    { value: 'cpu2', label: 'AMD Ryzen 9 7950X', socket: 'AM5', price: 10500000 },
    { value: 'cpu3', label: 'Intel Core i7-13700K', socket: 'LGA1700', price: 6500000 },
    { value: 'cpu4', label: 'AMD Ryzen 7 7700X', socket: 'AM5', price: 6000000 },
  ],
  gpuOptions: [
    { value: '', label: 'Select GPU', price: 0 },
    { value: 'gpu1', label: 'NVIDIA GeForce RTX 4090', price: 24000000 },
    { value: 'gpu2', label: 'AMD Radeon RX 7900 XTX', price: 15000000 },
    { value: 'gpu3', label: 'NVIDIA GeForce RTX 4080', price: 18000000 },
    { value: 'gpu4', label: 'AMD Radeon RX 6800 XT', price: 10000000 },
  ],
  motherboardOptions: [
    { value: '', label: 'Select Motherboard', price: 0 },
    { value: 'mobo1', label: 'ASUS ROG Maximus Z790 Hero', socket: 'LGA1700', price: 9000000 },
    { value: 'mobo2', label: 'MSI MPG X670E Carbon WiFi', socket: 'AM5', price: 7500000 },
    { value: 'mobo3', label: 'Gigabyte X670E Aorus Master', socket: 'AM5', price: 7000000 },
    { value: 'mobo4', label: 'ASUS ROG Strix Z690-E Gaming WiFi', socket: 'LGA1700', price: 6500000 },
  ],
  ramOptions: [
    { value: '', label: 'Select RAM', price: 0 },
    { value: 'ram1', label: 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5-6000', price: 4500000 },
    { value: 'ram2', label: 'Corsair Vengeance RGB RT 32GB (2x16GB) DDR5-5600', price: 4000000 },
    { value: 'ram3', label: 'Kingston Fury Beast 32GB (2x16GB) DDR5-5600', price: 3500000 },
    { value: 'ram4', label: 'G.Skill Ripjaws V 16GB (2x8GB) DDR4-3600', price: 1500000 },
  ],
  ssdOptions: [
    { value: '', label: 'Select SSD', price: 0 },
    { value: 'ssd1', label: 'Samsung 980 Pro 2TB NVMe M.2', price: 5000000 },
    { value: 'ssd2', label: 'WD Black SN850 1TB NVMe M.2', price: 3000000 },
    { value: 'ssd3', label: 'Crucial P5 Plus 1TB NVMe M.2', price: 2500000 },
    { value: 'ssd4', label: 'Seagate FireCuda 520 1TB NVMe M.2', price: 2000000 },
  ],
  hddOptions: [
    { value: '', label: 'Select HDD', price: 0 },
    { value: 'hdd1', label: 'Seagate BarraCuda 4TB 3.5"', price: 1500000 },
    { value: 'hdd2', label: 'Western Digital Blue 2TB 3.5"', price: 1000000 },
    { value: 'hdd3', label: 'Toshiba P300 1TB 3.5"', price: 750000 },
    { value: 'hdd4', label: 'Hitachi Ultrastar 8TB 3.5"', price: 2000000 },
  ],
  caseOptions: [
    { value: '', label: 'Select Case', price: 0 },
    { value: 'case1', label: 'Lian Li O11 Dynamic EVO', price: 2500000 },
    { value: 'case2', label: 'Corsair 4000D Airflow', price: 1500000 },
    { value: 'case3', label: 'NZXT H510 Flow', price: 1250000 },
    { value: 'case4', label: 'Fractal Design Meshify C', price: 1000000 },
  ],
  monitorOptions: [
    { value: '', label: 'Select Monitor', price: 0 },
    { value: 'monitor1', label: 'LG UltraGear 27GN950-B 27" 4K 144Hz', price: 10000000 },
    { value: 'monitor2', label: 'Samsung Odyssey G7 27" 1440p 240Hz', price: 8000000 },
    { value: 'monitor3', label: 'ASUS TUF Gaming VG27AQ 27" 1440p 165Hz', price: 6000000 },
    { value: 'monitor4', label: 'Dell S2721DGFA 27" 1440p 165Hz', price: 5000000 },
  ],
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const History = () => {
  const { userid } = useContext(AuthContext);
  const [savedConfigs, setSavedConfigs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedConfigs = async () => {
      console.log('Fetching saved configurations for user:', userid); // Debugging log
      try {
        const response = await axios.get('https://backend.agungyzs.site/api/history', {
          withCredentials: true, // Ensure cookies are sent with the request
        });
        console.log('Fetched configurations:', response.data); // Debugging log
        setSavedConfigs(response.data);
      } catch (error) {
        console.error('Error fetching saved configs:', error);
      }
    };

    fetchSavedConfigs();
  }, [userid]);

  const handleDelete = async (simulationid) => {
    if (window.confirm('Are you sure you want to delete this saved simulation?')) {
      try {
        await axios.delete(`https://backend.agungyzs.site/api/history/${simulationid}`, {
          withCredentials: true, // Ensure cookies are sent with the request
        });
        setSavedConfigs(savedConfigs.filter(config => config.simulationid !== simulationid));
      } catch (error) {
        console.error('Error deleting saved config:', error);
      }
    }
  };

  const handleBuild = async (config) => {
    const getOptionLabelAndPrice = (optionsArray, value) => {
      const option = optionsArray.find(opt => opt.value === value);
      return option ? { label: option.label, price: option.price } : { label: 'Unknown', price: 0 };
    };
  
    const calculateTotalPrice = (config) => {
      const components = [
        getOptionLabelAndPrice(options.cpuOptions, config.cpu),
        getOptionLabelAndPrice(options.gpuOptions, config.gpu),
        getOptionLabelAndPrice(options.motherboardOptions, config.motherboard),
        getOptionLabelAndPrice(options.ramOptions, config.ram),
        getOptionLabelAndPrice(options.ssdOptions, config.ssd),
        getOptionLabelAndPrice(options.hddOptions, config.hdd),
        getOptionLabelAndPrice(options.caseOptions, config.pcCase),
        getOptionLabelAndPrice(options.monitorOptions, config.monitor),
      ];
      return components.reduce((total, component) => total + component.price, 0);
    };
  
    const totalPrice = calculateTotalPrice(config).toLocaleString('id-ID');
  
    const formattedData = {
      sheetName: 'Builds',
      Name: config.name,
      PhoneNumber: config.phoneNumber,
      CPU: getOptionLabelAndPrice(options.cpuOptions, config.cpu).label,
      Motherboard: getOptionLabelAndPrice(options.motherboardOptions, config.motherboard).label,
      GPU: getOptionLabelAndPrice(options.gpuOptions, config.gpu).label,
      RAM: getOptionLabelAndPrice(options.ramOptions, config.ram).label,
      SSD: getOptionLabelAndPrice(options.ssdOptions, config.ssd).label,
      HDD: getOptionLabelAndPrice(options.hddOptions, config.hdd).label,
      Case: getOptionLabelAndPrice(options.caseOptions, config.pcCase).label,
      Monitor: getOptionLabelAndPrice(options.monitorOptions, config.monitor).label,
      TotalPrice: totalPrice,
      CreatedAt: config.created_at,
    };
  
    try {
      await axios.post('https://script.google.com/macros/s/AKfycbyPhMr-Sko1JL8N0OC9xNNSFzSTqqP4ZEqogTwxdtPcKYCwUQmwIakOerlCM9_st_U8/exec', formattedData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      alert('Build data sent to Google Spreadsheet');
    } catch (error) {
      alert('Sent data to Build just wait until we call!');
    }
  };
  

  const handleEdit = (simulationid) => {
    navigate(`/simulation/${simulationid}`);
  };

  const getOptionLabelAndPrice = (optionsArray, value) => {
    const option = optionsArray.find(opt => opt.value === value);
    return option ? { label: option.label, price: option.price } : { label: 'Unknown', price: 0 };
  };

  const calculateTotalPrice = (config) => {
    const components = [
      getOptionLabelAndPrice(options.cpuOptions, config.cpu),
      getOptionLabelAndPrice(options.gpuOptions, config.gpu),
      getOptionLabelAndPrice(options.motherboardOptions, config.motherboard),
      getOptionLabelAndPrice(options.ramOptions, config.ram),
      getOptionLabelAndPrice(options.ssdOptions, config.ssd),
      getOptionLabelAndPrice(options.hddOptions, config.hdd),
      getOptionLabelAndPrice(options.caseOptions, config.pcCase),
      getOptionLabelAndPrice(options.monitorOptions, config.monitor),
    ];
    return components.reduce((total, component) => total + component.price, 0);
  };

  return (
    <div className="history-container">
      <h2>Saved Simulations</h2>
      <table className="history__table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone Number</th>
            <th>CPU</th>
            <th>Motherboard</th>
            <th>GPU</th>
            <th>RAM</th>
            <th>SSD</th>
            <th>HDD</th>
            <th>Case</th>
            <th>Monitor</th>
            <th>Created At</th>
            <th>Total Price (IDR)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {savedConfigs.map((config) => (
            <tr key={config.simulationid}>
              <td>{config.name}</td>
              <td>{config.phoneNumber}</td>
              <td>{getOptionLabelAndPrice(options.cpuOptions, config.cpu).label}</td>
              <td>{getOptionLabelAndPrice(options.motherboardOptions, config.motherboard).label}</td>
              <td>{getOptionLabelAndPrice(options.gpuOptions, config.gpu).label}</td>
              <td>{getOptionLabelAndPrice(options.ramOptions, config.ram).label}</td>
              <td>{getOptionLabelAndPrice(options.ssdOptions, config.ssd).label}</td>
              <td>{getOptionLabelAndPrice(options.hddOptions, config.hdd).label}</td>
              <td>{getOptionLabelAndPrice(options.caseOptions, config.pcCase).label}</td>
              <td>{getOptionLabelAndPrice(options.monitorOptions, config.monitor).label}</td>
              <td>{formatDate(config.created_at)}</td>
              <td>{calculateTotalPrice(config).toLocaleString('id-ID')}</td>
              <td>
                <button
                  className="history__edit-button"
                  onClick={() => handleEdit(config.simulationid)}
                >
                  Edit
                </button>
                <button
                  className="history__delete-button"
                  onClick={() => handleDelete(config.simulationid)}
                >
                  Delete
                </button>
                <button
                  className="history__build-button"
                  onClick={() => handleBuild(config)}
                >
                  Build
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;
