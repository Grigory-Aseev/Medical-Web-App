package com.app.medicalwebapp.services;

import com.app.medicalwebapp.model.FileObject;
import com.app.medicalwebapp.model.FileObjectFormat;
import com.app.medicalwebapp.repositories.FileObjectRepository;
import com.app.medicalwebapp.utils.FileFormatResolver;
import com.app.medicalwebapp.utils.extracting.FileExtractorStrategy;
import com.app.medicalwebapp.utils.extracting.FileExtractorStrategyResolver;
import com.app.medicalwebapp.utils.saving.FileSaverStrategy;
import com.app.medicalwebapp.utils.saving.FileSaverStrategyResolver;
import com.jcraft.jsch.JSchException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class FileService {
    private final FileSaverStrategyResolver saverStrategyResolver;
    private final FileExtractorStrategyResolver extractorStrategyResolver;
    private final FileObjectRepository fileObjectRepository;

    @Autowired
    public FileService(FileSaverStrategyResolver saverStrategyResolver,
            FileExtractorStrategyResolver extractorStrategyResolver, FileObjectRepository fileObjectRepository) {
        this.saverStrategyResolver = saverStrategyResolver;
        this.extractorStrategyResolver = extractorStrategyResolver;
        this.fileObjectRepository = fileObjectRepository;
    }

    /**
     * Сохранение файла.
     */
    public FileObject saveFile(String originalName, byte[] fileContent, Long ownerId, String UID) throws Exception {
        // Проверка файлов на идентичные загруженные файлы на сервере
        var savedFiles = fileObjectRepository.findByOwnerAndDeleted(ownerId, false);
        var element = savedFiles.stream()
                .filter(x -> {
                    try {
                        return (Arrays.equals(fileContent, previewFile(x)));
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    return false;
                })
                .findFirst();

        if (element.isPresent()) {
            return element.get();
        } else {
            // Выбрать способ сохранения файла, зависит от его расширения.
            FileSaverStrategy fileSaver = saverStrategyResolver.getFileSaver(originalName);
            FileObjectFormat format = FileFormatResolver.resolveFormat(originalName);
            return fileSaver.save(ownerId, originalName, format, fileContent, UID);
        }
    }

    /**
     * Скачивание файла.
     */
    public byte[] extractFile(FileObject fileObject) throws Exception {
        // Выбрать способ скачивания файла, зависит от его расширения.
        FileExtractorStrategy fileExtractor = extractorStrategyResolver.getFileExtractor(fileObject.getFormat());
        return fileExtractor.getFileInActualFormat(fileObject);
    }

    /**
     * Отображение файла.
     */
    public byte[] previewFile(FileObject fileObject) throws Exception {
        // Выбрать способ отображения файла, зависит от его расширения.
        FileExtractorStrategy fileExtractor = extractorStrategyResolver.getFileExtractor(fileObject.getFormat());
        return fileExtractor.getHumanReadablePresentation(fileObject);
    }

    /**
     * Удаление файла.
     */
    public boolean deleteFile(Long fileId) {
        var fileToDelete = fileObjectRepository.findById(fileId).orElse(null);
        if (fileToDelete == null)
            return false;

        fileToDelete.setDeleted(true); // Файлы удаляются "лениво", всегда остаются в БД.
        fileObjectRepository.save(fileToDelete);
        return true;
    }

    /**
     * Редактирование названия файла.
     */
    public FileObject editFile(String newName, Long fileId) throws Exception {
        if (newName == null)
            throw new IllegalArgumentException();
        var file = fileObjectRepository.findById(fileId).orElse(null);
        if (file == null)
            return null;

        file.setInitialName(newName);
        fileObjectRepository.save(file);
        return file;
    }
}
