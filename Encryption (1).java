import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

public class Encryption {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH = 128;

    public static String encrypt(String plainText, byte[] key) throws Exception {

        byte[] iv = new byte[IV_LENGTH];
        SecureRandom random = new SecureRandom();
        random.nextBytes(iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);

        SecretKeySpec secretKey =
                new SecretKeySpec(key, "AES");

        GCMParameterSpec gcmSpec =
                new GCMParameterSpec(TAG_LENGTH, iv);

        cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);

        byte[] encrypted =
                cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

        byte[] result =
                new byte[iv.length + encrypted.length];

        System.arraycopy(iv, 0, result, 0, iv.length);
        System.arraycopy(
                encrypted,
                0,
                result,
                iv.length,
                encrypted.length
        );

        return Base64.getEncoder().encodeToString(result);
    }

    public static String decrypt(String encryptedText, byte[] key)
            throws Exception {

        byte[] data =
                Base64.getDecoder().decode(encryptedText);

        byte[] iv =
                new byte[IV_LENGTH];

        byte[] encrypted =
                new byte[data.length - IV_LENGTH];

        System.arraycopy(data, 0, iv, 0, IV_LENGTH);

        System.arraycopy(
                data,
                IV_LENGTH,
                encrypted,
                0,
                encrypted.length
        );

        Cipher cipher =
                Cipher.getInstance(ALGORITHM);

        SecretKeySpec secretKey =
                new SecretKeySpec(key, "AES");

        GCMParameterSpec gcmSpec =
                new GCMParameterSpec(TAG_LENGTH, iv);

        cipher.init(
                Cipher.DECRYPT_MODE,
                secretKey,
                gcmSpec
        );

        byte[] decrypted =
                cipher.doFinal(encrypted);

        return new String(
                decrypted,
                StandardCharsets.UTF_8
        );
    }
}