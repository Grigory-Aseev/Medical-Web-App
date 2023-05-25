package com.app.medicalwebapp.repositories.messenger_repositories;

import com.app.medicalwebapp.model.messenger_models.ChatMessage;
import com.app.medicalwebapp.model.messenger_models.StatusMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    Optional<List<ChatMessage>> findByChatIdAndDeleted(String chatId, boolean deleted);

    Optional<ChatMessage> findFirstByChatIdAndDeleted_IsFalseOrderByIdDesc(String chatId);

    Optional<List<ChatMessage>> findByRecipientIdAndStatusMessageAndDeleted(Long recipientId, StatusMessage UNREAD, boolean deleted);

    ChatMessage findBySendDateAndChatId(LocalDateTime sendDate, String chatId);

    ChatMessage findFirstById(Long id);
}
