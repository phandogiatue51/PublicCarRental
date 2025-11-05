import { useState, useRef, useEffect } from 'react';
import {
    Box, Button, VStack, Text, Alert, AlertIcon,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter
} from '@chakra-ui/react';
import { qrAPI } from '../../../../services/api';
import { AiOutlineQrcode } from "react-icons/ai";

export default function QRCameraScanner({ onBankInfoScanned, isOpen, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [stream, setStream] = useState(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError('Cannot access camera: ' + err.message);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureAndScan = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setScanning(true);
        setError('');

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async (blob) => {
                try {
                    const file = new File([blob], 'qr-capture.jpg', { type: 'image/jpeg' });
                    const result = await qrAPI.scanQRUpload(file);
                    
                    if (result.success && result.data) {
                        onBankInfoScanned(result.data);
                        onClose();
                    } else {
                        setError('No QR code detected. Try again.');
                    }
                } catch (err) {
                    setError('Scanning failed: ' + err.message);
                } finally {
                    setScanning(false);
                }
            }, 'image/jpeg', 0.8);
        } catch (err) {
            setError('Capture failed: ' + err.message);
            setScanning(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Scan QR Code with Camera</ModalHeader>
                <ModalBody>
                    <VStack spacing={4}>
                        <Box 
                            position="relative" 
                            width="100%" 
                            height="300px" 
                            bg="black" 
                            borderRadius="md"
                            overflow="hidden"
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <Box
                                position="absolute"
                                top="50%"
                                left="50%"
                                transform="translate(-50%, -50%)"
                                width="200px"
                                height="200px"
                                border="2px"
                                borderColor="white"
                                borderRadius="md"
                                boxShadow="0 0 0 4000px rgba(0,0,0,0.3)"
                            />
                        </Box>

                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {error && (
                            <Alert status="error" size="sm">
                                <AlertIcon />
                                {error}
                            </Alert>
                        )}

                        <Text fontSize="sm" textAlign="center" color="gray.600">
                            Position the QR code within the frame
                        </Text>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="outline" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={captureAndScan}
                        isLoading={scanning}
                        leftIcon={<AiOutlineQrcode />}
                    >
                        Scan QR Code
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}