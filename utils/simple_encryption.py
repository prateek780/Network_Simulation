def simple_xor_encrypt(text, binary_key):
    """Encrypt text using a binary list (0s and 1s) as key"""
    encrypted = bytearray()
    for i, char in enumerate(text):
        # Use modulo to cycle through the key
        key_bit = binary_key[i % len(binary_key)]
        
        # If key bit is 1, flip the 4th bit of the character
        char_code = ord(char)
        if key_bit == 1:
            char_code ^= 8  # XOR with 1000 in binary to flip 4th bit
        
        encrypted.append(char_code)
    
    return encrypted

def simple_xor_decrypt(encrypted_data, binary_key):
    """Decrypt data that was encrypted with the binary key"""
    decrypted = ""
    for i, byte in enumerate(encrypted_data):
        # Use the same key bit as used in encryption
        key_bit = binary_key[i % len(binary_key)]
        
        # If key bit was 1, flip the 4th bit back
        char_code = byte
        if key_bit == 1:
            char_code ^= 8  # XOR with same value undoes the flip
        
        decrypted += chr(char_code)
    
    return decrypted