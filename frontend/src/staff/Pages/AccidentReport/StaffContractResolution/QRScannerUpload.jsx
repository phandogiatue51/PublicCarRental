import { useState, useRef } from 'react';
import {
    Box, Button, VStack, Text, Image, Alert, AlertIcon,
    FormControl, FormLabel, Input, HStack, IconButton
} from '@chakra-ui/react';
import { CloseIcon, AttachmentIcon } from '@chakra-ui/icons';
import { qrAPI } from '../../../../services/api';

export default function QRScannerUpload({ onBankInfoScanned, existingBankInfo }) {
    const [scanning, setScanning] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        setScanning(true);
        setError('');
        
        // Create preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        try {
            const result = await qrAPI.scanQRUpload(file);
            
            if (result.success && result.data) {
                const bankInfo = result.data;
                onBankInfoScanned(bankInfo);
            } else {
                setError('No QR code found or invalid format');
            }
        } catch (err) {
            console.error('QR scan error:', err);
            setError('Error scanning QR code: ' + (err.message || 'Unknown error'));
        } finally {
            setScanning(false);
        }
    };

    const clearScan = () => {
        setPreviewUrl('');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Box border="1px" borderColor="gray.200" borderRadius="md" p={4}>
            <VStack spacing={4} align="stretch">
                <Text fontWeight="medium">Quick Fill with QR Code</Text>
                
                {!previewUrl ? (
                    <Button
                        leftIcon={<AttachmentIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={scanning}
                        colorScheme="blue"
                        variant="outline"
                    >
                        Upload QR Code Image
                    </Button>
                ) : (
                    <Box textAlign="center">
                        <Text fontSize="sm" mb={2}>QR Code Preview:</Text>
                        <Box position="relative" display="inline-block">
                            <Image
                                src={previewUrl}
                                alt="QR Code Preview"
                                maxH="150px"
                                borderRadius="md"
                            />
                            <IconButton
                                icon={<CloseIcon />}
                                size="sm"
                                position="absolute"
                                top={1}
                                right={1}
                                onClick={clearScan}
                                aria-label="Remove QR code"
                            />
                        </Box>
                    </Box>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                />

                {error && (
                    <Alert status="error" size="sm">
                        <AlertIcon />
                        {error}
                    </Alert>
                )}

                {scanning && (
                    <Text fontSize="sm" color="blue.600" textAlign="center">
                        Scanning QR code...
                    </Text>
                )}
            </VStack>
        </Box>
    );
}