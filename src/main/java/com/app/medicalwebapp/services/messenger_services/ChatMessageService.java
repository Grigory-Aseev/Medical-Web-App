package com.app.medicalwebapp.services.messenger_services;

import com.app.medicalwebapp.controllers.requestbody.messenger.ChatFileRequest;
import com.app.medicalwebapp.controllers.requestbody.messenger.ChatMessageRequest;
import com.app.medicalwebapp.model.FileObject;
import com.app.medicalwebapp.model.FileObjectFormat;
import com.app.medicalwebapp.model.messenger_models.ChatMessage;
import com.app.medicalwebapp.model.messenger_models.StatusMessage;
import com.app.medicalwebapp.repositories.FileObjectRepository;
import com.app.medicalwebapp.repositories.messenger_repositories.ChatMessageRepository;
import com.app.medicalwebapp.services.FileService;
import com.app.medicalwebapp.services.service_utils.MemoUpload;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository;
    private final FileObjectRepository fileObjectRepository;
    private final FileService fileService;

    @Autowired
    public ChatMessageService(ChatMessageRepository chatMessageRepository, FileObjectRepository fileObjectRepository, FileService fileService){
        this.chatMessageRepository = chatMessageRepository;
        this.fileObjectRepository = fileObjectRepository;
        this.fileService = fileService;
    }

    /**
     * Сохранение отправленного сообщения в базу данных.
     */
    @Transactional
    public ChatMessage save(ChatMessageRequest msg) throws Exception {
        List<FileObject> files = new ArrayList<>();
        List<ChatMessage> forwardedMessages = new ArrayList<>();
        MemoUpload memoize = new MemoUpload(fileObjectRepository, fileService);

        // Если к сообщению прикреплены файлы, необходимо строку base64 декодировать в byte[] и отправить файл на сохранение.
        if (msg.getFiles() != null) {
            for (ChatFileRequest file : msg.getFiles()) {
                Base64.Decoder decoder = Base64.getDecoder();
                String fileBase64 = file.getFileContent().split(",")[1];
                byte[] decodedFileByte = decoder.decode(fileBase64);
                var checkUploadFile = memoize.checkMemo(msg.getSenderId(), decodedFileByte);
                if (checkUploadFile != null) {
                    files.add(checkUploadFile);
                } else {
                    files.add(fileService.saveFile(file.getFileName(), decodedFileByte, msg.getSenderId(), msg.getUid()));
                }
            }
        }

        if (msg.getForwardedMessages() != null) {
            for (Long msgId : msg.getForwardedMessages()) {
                ChatMessage forwardedMsg = chatMessageRepository.findFirstById(msgId);
                forwardedMessages.add(forwardedMsg);
            }
        }

        String chatId;
        if (msg.getChatId() == null) {
            chatId = chatIdGenerateByTwoUser(msg.getSenderName(), msg.getRecipientName());
        } else {
            chatId = msg.getChatId();
        }

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setChatId(chatId);
        chatMessage.setType(msg.getType());
        chatMessage.setRecipientId(msg.getRecipientId());
        chatMessage.setSenderId(msg.getSenderId());
        chatMessage.setRecipientName(msg.getRecipientName());
        chatMessage.setSenderName(msg.getSenderName());
        chatMessage.setContent(msg.getContent());
        chatMessage.setStatusMessage(StatusMessage.UNREAD);
        chatMessage.setSendDate(msg.getSendDate());
        chatMessage.setTimeZone(msg.getTimeZone());
        chatMessage.setAttachments(files);
        chatMessage.setForwardedMessages(forwardedMessages);
        chatMessage.setDeleted(false);
        var message = chatMessageRepository.save(chatMessage);
        System.out.println(message);
        // Необходимо воспользоваться функцией getImages(), и получить byte[] через функцию fileService.previewFile(),
        // так как иначе изображение не будет корректно отображено на клиенте.
        if (message.getAttachments().size() > 0) {
            getImages(List.of(message));
        }
        return message;
    }

    /**
     * Поиск всех сообщений между двумя пользователями.
     */
    public List<ChatMessage> findMessages(String chatId) throws Exception {
        List<ChatMessage> messages;
        Optional<List<ChatMessage>> messagesOptional = chatMessageRepository.findByChatIdAndDeleted(chatId, false);
        messages = messagesOptional.orElseGet(ArrayList::new);

        // Если сообщения были найдены, необходимо проверить наличие в них прикрепленных изображений.
        if (messages.size() > 0) {
            getImages(messages);
        }

        return messages;
    }



    /**
     * Функция устанавливает в объекты сообщений данные о UID и byte[]
     */
    public List<ChatMessage> getImages(List<ChatMessage> messages) throws Exception {
        for (ChatMessage message : messages) {
            if (message.getAttachments().size() > 0) {
                ArrayList<byte[]> data = new ArrayList<>();
                message.setImages(data);
                ArrayList<String> uid = new ArrayList<>();
                message.setUidFilesDicom(uid);
                for (int j = 0; j < message.getAttachments().size(); j++) {
                    var format = message.getAttachments().get(j).getFormat();
                    // Если к сообщению были прикреплены изображения, устанавливаем данные о byte[] и uid в поля объекта,
                    // но не сохраняем их в базу данных, так как в этом нет необходимости.

                    // Если это изображение, необходимо отправить byte[] для того, чтобы его отобразить на клиенте.
                    if (format == FileObjectFormat.DICOM ||
                            format == FileObjectFormat.JPEG ||
                            format == FileObjectFormat.PNG) {
                        FileObject fileObject = message.getAttachments().get(j);
                        byte[] fileContent = fileService.previewFile(fileObject);
                        message.getImages().add(fileContent);

                        // Если файл формата .dcm необходимо отправить данные о UID.
                        if (format == FileObjectFormat.DICOM) {
                            message.getUidFilesDicom().add(message.getAttachments().get(j).getUID());
                        }
                    }
                }
            }
        }
        return messages;
    }

    /**
     * Поиск непрочитанных сообщений.
     */
    public List<ChatMessage> findUnreadMessages(Long recipientId) {
        List<ChatMessage> messages;
        Optional<List<ChatMessage>> messagesOptional =
                chatMessageRepository.findByRecipientIdAndStatusMessageAndDeleted(recipientId, StatusMessage.UNREAD, false);
        messages = messagesOptional.orElseGet(ArrayList::new);
        return messages;
    }

    /**
     * Обновление статуса сообщений на READ (то есть сообщения были прочитаны)
     */
    public void updateUnreadMessages(List<ChatMessage> messages) {
        for (ChatMessage message : messages) {
            message.setStatusMessage(StatusMessage.READ);
            chatMessageRepository.save(message);
        }
    }

    private void delete(ChatMessage msg) {
        msg.setDeleted(true);
        chatMessageRepository.save(msg);
    }

    /**
     * Удаление сообщения.
     */
    public void deleteMessage(ChatMessage message) throws Exception {
        this.delete(message);
    }

    /**
     * Удаление сообщения с предварительным поиском нужного сообщения по времени отправления и chatId.
     */
    public void deleteMsgByTimeAndChatId(LocalDateTime time, String senderUsername, String recipientUsername) {
        String chatId = chatIdGenerateByTwoUser(senderUsername, recipientUsername);

        ChatMessage messageToDelete = chatMessageRepository.findBySendDateAndChatId(time, chatId);
        this.delete(messageToDelete);
    }

    public Optional<ChatMessage> findFirstByChatIdOrderBySendDateDesc(String chatId) {
        return chatMessageRepository.findFirstByChatIdAndDeleted_IsFalseOrderByIdDesc(chatId);
    }

    public List<ChatMessage> findMessagesByKeywords(String senderUsername, String recipientUsername, String keywordsString) throws Exception {
        String[] keywords = keywordsString.split(" ");
        String chatId = chatIdGenerateByTwoUser(senderUsername, recipientUsername);
        var allMessages = this.findMessages(chatId);
        var foundMessages = new ArrayList<ChatMessage>();
        for (String keyword : keywords) {
            foundMessages.addAll(allMessages
                    .stream()
                    .filter(msg -> msg.getContent().contains(keyword))
                    .collect(Collectors.toList())
            );
        }
        return foundMessages;
    }

    /**
     * Поиск сообщения по времени отправления и chatId.
     */
    public ChatMessage getMsgByTimeAndChatId(LocalDateTime time, String senderName, String recipientName) {
        String chatId = chatIdGenerateByTwoUser(senderName, recipientName);

        var count = 0;
        ChatMessage message = chatMessageRepository.findBySendDateAndChatId(time, chatId);
        while (message == null && count <= 1000) {
            message = chatMessageRepository.findBySendDateAndChatId(time, chatId);
            count++;
        }
        return message;
    }

    public String chatIdGenerateByTwoUser(String senderName, String recipientName) {
        String chatId;
        if (senderName.compareTo(recipientName) < 0) {
            chatId = (senderName + recipientName);
        } else {
            chatId = (recipientName + senderName);
        }
        return chatId;
    }
}

