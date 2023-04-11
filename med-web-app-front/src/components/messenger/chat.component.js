import {Card, Divider, List, Paper, TextField, Typography, withStyles} from "@material-ui/core"
import {Link, useParams} from "react-router-dom"
import React, {useEffect, useRef, useState} from "react"
import UserService from "../../services/user.service"
import Grid from "@material-ui/core/Grid"
import AuthService from "../../services/auth.service"
import AttachmentService from "../../services/attachment.service"
import Button from "@material-ui/core/Button"
import ListItemButton from "@mui/material/ListItemButton"
import UserCardMessage from "./user-card-msg.component"
import ChatService from "../../services/chat.service"
import RecipientMsg from "./recipient.msg.component"
import SenderMsg from "./sender.msg.component"
import Avatar from "@material-ui/core/Avatar"
import AttachFileIcon from "@mui/icons-material/AttachFile"
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import SendIcon from "@mui/icons-material/Send"
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined"
import Dropdown from "react-bootstrap/Dropdown"
import ButtonGroup from "react-bootstrap/ButtonGroup"
import DropdownButton from "react-bootstrap/DropdownButton"
import Select from "@material-ui/core/Select"
import MenuItem from "@material-ui/core/MenuItem"
import Input from "@material-ui/core/Input"
import Chip from "@material-ui/core/Chip"
import FormControl from "@material-ui/core/FormControl"
import Container from "@material-ui/core/Container"
import InputLabel from "@material-ui/core/InputLabel"
import Modal from "react-bootstrap/Modal"
import Upload from "./upload-files.component"

/**
 * Стили для компонентов mui и react.
 */
const useStyles = theme => ({
    root: {
        width: 510,
        marginLeft: 6,
        marginRight: 6,
        "& .MuiFormLabel-root": {
            margin: 0,
            color: "black"
        }
    },
    inputSearchContacts: {
        width: 305,
        margin: 6,
        marginRight: 6,
        marginTop: 8,
        "& .MuiFormLabel-root": {
            margin: 0,
            color: "black"
        }
    },
    inputSearchMsg: {
        width: 650,
        marginTop: theme.spacing(-2),
        marginBottom: theme.spacing(1),
        "& .MuiFormLabel-root": {
            margin: 0,
            color: "black"
        }
    },
    paper: {
        marginTop: theme.spacing(3),
        marginRight: theme.spacing(2),
        marginLeft: theme.spacing(-7),
        color: "black",
        overflowY: "auto",
        height: 623,
    },
    paper2: {
        marginTop: theme.spacing(3),
        padding: theme.spacing(3),
        color: "black",
        minHeight: 600,
        width: 700
    },
    paper3: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
        padding: theme.spacing(2),
        [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
            marginTop: theme.spacing(6),
            marginBottom: theme.spacing(6),
            padding: theme.spacing(3),
        },
    },
    layout: {
        width: "auto",
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
            width: 400,
            marginLeft: "auto",
            marginRight: "auto",
        },
    },
    mainGrid: {
        display: 'flex',
        minWidth: 1000,
        marginTop: theme.spacing(-2),
    },
    button: {
        width: 220,
        '&:active': {
            backgroundColor: '#bdff59',
        }
    },
    messageGrid: {
        width: 650,
        height: 507,
        overflowY: "auto",
        marginBottom: theme.spacing(1.5),
    },
    msgMy: {
        width: "fit-content",
        height: "fit-content",
        margin: 20,
        marginLeft: "auto",
        backgroundColor: '#a1e9ff',
        padding: theme.spacing(0.5),
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        maxWidth: 400,
    },
    msgNotMy: {
        width: "fit-content",
        height: "fit-content",
        margin: 20,
        padding: theme.spacing(0.5),
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        maxWidth: 400,
        elevation: 2
    },
    txt: {
        fontWeight: 'bold',
        marginTop: 0,
        marginBottom: 10
    },
    noticeMsg: {
        backgroundColor: '#FF0040',
        textAlign: 'center',
        color: 'white',
        width: 25
    },
    itemButton: {
        padding: 0,
    },
    usersGrid: {
        height: 440,
        overflowY: "auto",
        marginBottom: theme.spacing(1.5),
    },
    active: {
        backgroundColor: '#FF0040',
    },
    avatar: {
        width: 45,
        height: 45,
        marginRight: theme.spacing(2),
        marginLeft: theme.spacing(-1),
    },
    flex: {
        display: 'flex',
    },
    lastMsgTimeContent: {
        color: '#888888',
        textAlign: "right"
    },
    lastMsgTextContent: {
        color: '#888888',
    },
    gridFullWidth: {
        width: '100%'
    },
    iconInput: {
        backgroundColor: "#3f51b5",
        borderRadius: '5px',
        width: "100%",
        height: 56,
    },
    rootSelect: {
        "& .MuiFormLabel-root": {
            margin: 0,
        },
    },
    formControl: {
        "& .MuiFormLabel-root": {
            margin: 0,
        },
        width: "100%",
    },
    chips: {
        display: "flex",
        flexWrap: "wrap",
    },
    chip: {
        margin: 2,
    },
})

function Chat(props) {
    const {stompClient} = props
    const {minusUnRead} = props
    const {usersWithLastMsg} = props
    const {setUsersWithLastMsg} = props
    const {allMessages} = props
    const {setAllMessages} = props
    const {classes} = props
    const {selected} = useParams() // Для selected устанавливается строка с логином, полученным из url. Например medwebapp.ru/msg/SELECTED_USERNAME
    const [processedUnreadMessages, setProcessedUnreadMessages] = useState([])
    const [content, setContent] = useState("")
    const [contentPresence, setContentPresence] = useState(false)
    const [contentCorrect, setContentCorrect] = useState("")

    const [searchContent, setSearchContent] = useState("")
    const [searchContentPresence, setSearchContentPresence] = useState(false)
    const [searchContentCorrect, setSearchContentCorrect] = useState("")

    const [searchContacts, setSearchContacts] = useState("")
    const [searchContactsPresence, setSearchContactsPresence] = useState(false)
    const [searchContactsCorrect, setSearchContactsCorrect] = useState("")

    const [selectedUser, setSelectedUser] = useState(null)
    const [allFiles, setAllFiles] = useState(null)
    const [selectFiles, setSelectFiles] = useState([])
    const [refresh, setRefresh] = useState({})
    const [selectedFiles, setSelectedFiles] = useState(null)
    const messagesEndRef = useRef(null)
    const fileInput = useRef(null)
    const [modalShow, setModalShow] = useState(false)
    useEffect(() => {
        getFiles();
        getContacts();
        window.addEventListener("keydown", handler, true);
        return () => window.removeEventListener("keydown", handler, true);
    }, [])

    const handler = (e) => {
        if (e.keyCode === 27) {
            setSelectedUser(null)
        }
    };

    /**
     * Функция добавляет выбранного пользователя в контакты.
     */
    function updateContacts() {
        UserService.pushContacts(AuthService.getCurrentUser().username, selected)
            .then(async (response) => {
                let user = response.data
                if (user.avatar) {
                    const base64Response = await fetch(`data:application/json;base64,${user.avatar}`)
                    const blob = await base64Response.blob()
                    user.avatar = URL.createObjectURL(blob)
                }
            })
            .catch((e) => {
                console.log(e)
            })
    }

    /**
     * Функция выбирает пользователя, которого нет в контактах, чтобы ему написать.
     */
    function selectNotInContactsUser() {
        UserService.getUserByUsername(selected)
            .then(async (response) => {
                let user = response.data
                selectUser(user)
            })
            .catch((e) => {
                console.log(e)
            })
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }

    const goToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "auto"})
    }

    /**
     * Удаление сообщения из MAP на клиенте, чтобы лишний раз не
     * делать запросы на сервер для обновления данных и получения сообщений.
     * @param msg
     */
    function deleteMsgClient(msg) {
        let newMsgArray;
        if (msg.id) {
            newMsgArray = allMessages.get(selectedUser.username).messages.filter(value => value.id !== msg.id)
        } else {
            newMsgArray = allMessages.get(selectedUser.username).messages.filter(value => value.sendDate !== msg.sendDate)
        }
        const valueMap = {unRead: 0, messages: newMsgArray}
        let lastMsg = null;
        if (newMsgArray.length > 0) {
            lastMsg = newMsgArray[newMsgArray.length - 1]
        }
        setAllMessages(prev => prev.set(selectedUser.username, valueMap))
        setUsersWithLastMsg(prev => prev.set(selectedUser.username, {
            first: selectedUser,
            second: lastMsg
        }))
        setRefresh({})
    }

    /**
     * Получение списка контактов для текущего
     * пользователя из базы данных
     */
    function getContacts() {
        UserService.getContacts(AuthService.getCurrentUser().username)
            .then((response) => {
                const userWithLastMsgArray = response.data.contactWithLastMsg
                userWithLastMsgArray.map(async user => {
                    if (user.first.avatar) {
                        const base64Response = await fetch(`data:application/json;base64,${user.first.avatar}`)
                        const blob = await base64Response.blob()
                        user.first.avatar = URL.createObjectURL(blob)
                    }
                    setUsersWithLastMsg(prev => prev.set(user.first.username, user))
                    setRefresh({})
                })
                const user = userWithLastMsgArray.find(user => user.first.username === selected)
                // Проверка есть ли выбранный пользователь в списке контактов, иначе он будет добавлен.
                if (selected && !user) {
                    selectNotInContactsUser()
                } else if (selected && user) {
                    selectUser(user.first)
                }
                // Данное состояние обновляется для принудительного рендеринга страниц
                setRefresh({})
            })
            .catch((e) => {
                console.log(e)
            })
    }

    function onChangeMessageContent(e) {
        let str = e.target.value
        str = str.replace(/ {2,}/g, ' ').trim()
        str = str.replace(/[\n\r ]{3,}/g, '\n\r\n\r')
        if (str.charCodeAt(0) > 32) {
            setContent(e.target.value)
            setContentCorrect(str)
            setContentPresence(true)
        } else {
            setContent(e.target.value)
            setContentCorrect(str)
            setContentPresence(false)
        }
    }

    function onChangeSearchContent(e) {
        let str = e.target.value
        str = str.replace(/ {2,}/g, ' ').trim()
        str = str.replace(/[\n\r ]{3,}/g, '\n\r\n\r')
        if (str.charCodeAt(0) > 32) {
            setSearchContent(e.target.value)
            setSearchContentCorrect(str)
            setSearchContentPresence(true)
        } else {
            setSearchContent(e.target.value)
            setSearchContentCorrect(str)
            setSearchContentPresence(false)
        }
    }

    function onChangeSearchContacts(e) {
        let str = e.target.value
        str = str.replace(/ {2,}/g, ' ').trim()
        str = str.replace(/[\n\r ]{3,}/g, '\n\r\n\r')
        if (str.charCodeAt(0) > 32) {
            setSearchContacts(e.target.value)
            setSearchContactsCorrect(str)
            setSearchContactsPresence(true)
        } else {
            setSearchContacts(e.target.value)
            setSearchContactsCorrect(str)
            setSearchContactsPresence(false)
        }
    }

    function checkKey(key) {
        if (key.key === "Enter" && key.shiftKey === false && selectedUser && contentPresence) {
            sendMessage()
        }
    }

    /**
     * Функция отправляет сообщение пользователю.
     */
    async function sendMessage() {
        if (stompClient) {
            let fileNameAndStringBase64 = []
            let pairFileNameBase64
            let uid = null
            if (selectFiles.length === 0) {
                if (selectedFiles) {
                    for (let i = 0; i < selectedFiles.length; i++) {
                        if (selectedFiles[i].name.endsWith(".dcm")) {
                            const fileBase64 = await Upload.uploadFiles(selectedFiles[i], true)
                            uid = fileBase64.uid
                            selectedFiles[i] = {name: fileBase64.name, uid: fileBase64.uid}
                            pairFileNameBase64 = {fileName: fileBase64.name, fileContent: fileBase64.image}
                        } else {
                            const fileBase64 = await Upload.uploadFiles(selectedFiles[i], false)
                            pairFileNameBase64 = {fileName: fileBase64.name, fileContent: fileBase64.image}
                        }
                        fileNameAndStringBase64.push(pairFileNameBase64)
                    }
                }
            } else {
                for (let i = 0; i < selectedFiles.length; i++) {
                    if (selectedFiles[i].name.endsWith(".jpg") ||
                        selectedFiles[i].name.endsWith(".png") ||
                        selectedFiles[i].name.endsWith(".dcm")) {
                            let response = await AttachmentService.getPreviewNew(selectedFiles[i].id).then(response => {
                                return response.data
                            }).catch(error => {
                                console.log(error)
                            })
                            const fileBase64 = await Upload.uploadFiles(response, true)
                            uid = selectFiles[i].uid
                            selectedFiles[i] = {name: fileBase64.name, image: fileBase64.image, uid: selectedFiles[i].uid}
                            pairFileNameBase64 = {fileName: selectedFiles[i].name, fileContent: selectedFiles[i].image};
                    }
                }
                fileNameAndStringBase64.push(pairFileNameBase64);
            }
            const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
            const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
            const message = {
                content: contentCorrect,
                recipientId: selectedUser.id,
                recipientName: selectedUser.username,
                senderId: AuthService.getCurrentUser().id,
                senderName: AuthService.getCurrentUser().username,
                attachmentsBlobForImageClient: selectedFiles,
                // Переменная используется для быстрой отрисовки отправленных изображений,
                // чтобы не делать лишних запросов к базе данных.
                files: fileNameAndStringBase64,
                sendDate: localISOTime,
                timeZone: timeZone,
                uid: uid
            }
            let isFirstMessage = true;

            // Проверка есть ли "история переписки" с выбранным пользователем, если есть,
            // то сообщение добавится к существующим.
            if (allMessages.get(selectedUser.username)) {
                isFirstMessage = false;
                let msg = allMessages.get(selectedUser.username).messages
                msg.push(message)
                const valueMap = {unRead: 0, messages: msg}
                setAllMessages(prev => (prev.set(selectedUser.username, valueMap)))
            } else {
                let msg = []
                msg.push(message)
                const valueMap = {unRead: 0, messages: msg}
                setAllMessages(prev => (prev.set(selectedUser.username, valueMap)))
            }
            setUsersWithLastMsg(prev => prev.set(selectedUser.username, {first: selectedUser, second: message}))
            stompClient.send("/app/send/" + selectedUser.username, {}, JSON.stringify(message))
            setSelectFiles([]);
            setSelectedFiles(null)
            setContent("")
            setContentCorrect("")
            setContentPresence(false)

            // Если это первое сообщение, необходимо добавить пользователя в список контактов.
            if (isFirstMessage)
                updateContacts();
        }
    }

    /**
     * Функция принимает в качестве аргумента пользователя и
     * получает из базы данных сообщения с данным пользователем
     * @param user
     */
    function selectUser(user) {
        setSelectedUser(user)
        ChatService.getMessages(AuthService.getCurrentUser().username, user.username)
            .then((response) => {
                if (response.data.length > 0) {
                    const valueMap = {unRead: 0, messages: response.data}
                    setAllMessages(prev => (prev.set(user.username, valueMap)))
                    setRefresh({}) // Данное состояние обновляется для принудительного рендеринга страницы.
                    goToBottom()
                }
            })
            .catch((e) => {
                console.log(e)
            })
        setRefresh({}) // Данное состояние обновляется для принудительного рендеринга страницы.
    }

    function selectFile() {
        fileInput.current.click()
    }

    /**
     * Функция находит время отправки сообщения для
     * часового пояса, в котором находится пользователь.
     * @param time
     * @param zone
     * @returns {Date}
     */
    function detectTimeInCurrentTimeZone(time, zone) {
        let messageTime = new Date(time)
        let timeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone)
        const difsTimeZones = getOffsetBetweenTimezonesForDate(new Date(), zone, timeZone)
        return (new Date(new Date(messageTime).getTime() - difsTimeZones))
    }

    function getOffsetBetweenTimezonesForDate(date, timezone1, timezone2) {
        const timezone1Date = convertDateToAnotherTimeZone(date, timezone1);
        const timezone2Date = convertDateToAnotherTimeZone(date, timezone2);
        return timezone1Date.getTime() - timezone2Date.getTime();
    }

    function convertDateToAnotherTimeZone(date, timezone) {
        const dateString = date.toLocaleString('en-US', {
            timeZone: timezone
        });
        return new Date(dateString);
    }

    /**
     * Функция определяет, когда было отправлено последнее сообщение от пользователей в списке
     * контактов, для того, чтобы показать пользователю:
     * время (если отправлено сегодня), вчера, день недели (если отправлено > 2 дней назад),
     * дату (если отправлено > 7 дней назад)
     * @returns {string|*|boolean}
     * @param timeMsg
     */
    function processTimeSend(timeMsg) {
        let today = new Date()
        let messageTime = new Date(timeMsg)
        if (today.toDateString() === messageTime.toDateString()) {
            return (((messageTime.getHours() < 10 && "0" + messageTime.getHours()) || messageTime.getHours() >= 10 && messageTime.getHours()) + ":"
                + ((messageTime.getMinutes() < 10 && "0" + messageTime.getMinutes())
                    || (messageTime.getMinutes() >= 10 && messageTime.getMinutes())
                ))
        } else if (today.getFullYear() === messageTime.getFullYear()) {
            let yesterday1 = new Date(today)
            yesterday1.setDate(yesterday1.getDate() - 1)
            if (yesterday1.getDate() === messageTime.getDate()) {
                return "Вчера"
            }
            const days = ["ВC", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"]
            for (let i = 0; i < 5; i++) {
                const dayOfWeek = getDayOfWeek(yesterday1, messageTime, days)
                if (dayOfWeek) {
                    return dayOfWeek
                }
            }
        }
        return (
            ((messageTime.getDate() < 10 && "0" + messageTime.getDate()) || (messageTime.getDate() >= 10 && messageTime.getDate()))
            + "."
            + (((messageTime.getMonth() + 1) < 10 && "0" + (messageTime.getMonth() + 1)) || (((messageTime.getMonth() + 1) >= 10 && (messageTime.getMonth() + 1))))
            + "." + messageTime.getFullYear()
        )

    }

    function getDayOfWeek(yesterday1, messageTime, days) {
        yesterday1.setDate(yesterday1.getDate() - 1)
        if (yesterday1.getDate() === messageTime.getDate() && yesterday1.getMonth() === messageTime.getMonth()) {
            return days [messageTime.getDay()]
        } else {
            return false
        }
    }

    /**
     * Функция сортирует пользователей в списке контактов по последне отправленному сообщению.
     * @returns {HTML}
     */
    function sortContacts() {
        let sortedContacts = [...usersWithLastMsg.values()]
        for (let i = 0; i < sortedContacts.length; i++) {
            if (sortedContacts[i].second !== null && sortedContacts[i].second.sendDate !== null && sortedContacts[i].second.timeZone !== null) {
                let timeInCurrentTimeZoneArray = detectTimeInCurrentTimeZone(sortedContacts[i].second.sendDate, sortedContacts[i].second.timeZone)
                sortedContacts[i] = {...sortedContacts[i], sendDateInCurrentTimeZone: timeInCurrentTimeZoneArray}
            }
        }
        sortedContacts.sort(function (a, b) {
            if (a.sendDateInCurrentTimeZone !== null && b.sendDateInCurrentTimeZone !== null) {
                const aTime = new Date(a.sendDateInCurrentTimeZone)
                const bTime = new Date(b.sendDateInCurrentTimeZone)
                if (aTime > bTime) {
                    return -1
                }
                if (aTime < bTime) {
                    return 1
                }
                return 0
            }
            return 0
        })
        return (sortedContacts
            .filter((userAndLastMsg, index) => {
                const nameAndSurname = userAndLastMsg.first.initials.split(" ")
                return (nameAndSurname[0] + " " + nameAndSurname[1]).includes(searchContacts)
            })
            .map((userAndLastMsg, index) => (
                <Grid key={index}>
                    <Link onClick={() => selectUser(userAndLastMsg.first)}
                          to={"/msg/" + userAndLastMsg.first.username}
                          style={{textDecoration: 'none'}}>
                        <ListItemButton
                            value={userAndLastMsg.first}
                            selected={selectedUser && selectedUser.username === userAndLastMsg.first.username}
                            title={userAndLastMsg.first.lastname + " " + userAndLastMsg.first.firstname}
                        >
                            <Grid className={classes.flex} xs={12} item>
                                <Grid xs={2} item>
                                    <Avatar className={classes.avatar} src={userAndLastMsg.first.avatar}>
                                        <PhotoCameraOutlinedIcon/>
                                    </Avatar>
                                </Grid>
                                <Grid xs={10} item>
                                    <Grid className={classes.gridFullWidth}>
                                        <Grid className={classes.flex} xs={12} item>
                                            <Grid xs={9} item>
                                                <UserCardMessage user={userAndLastMsg.first}
                                                />
                                            </Grid>
                                            <Grid xs={3} item>
                                                <Grid className={classes.lastMsgTimeContent}>
                                                    {
                                                        userAndLastMsg.sendDateInCurrentTimeZone && processTimeSend(userAndLastMsg.sendDateInCurrentTimeZone)
                                                    }
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid className={classes.flex} xs={12} item>
                                        <Grid xs={10} item
                                              className={classes.lastMsgTextContent}>{
                                            (userAndLastMsg.second && userAndLastMsg.second.content && userAndLastMsg.second.content.length < 25 && userAndLastMsg.second.content.length > 0 && userAndLastMsg.second.content)
                                            || (userAndLastMsg.second && userAndLastMsg.second.content && userAndLastMsg.second.content.length > 25 && userAndLastMsg.second.content.slice(0, 25) + "...")
                                            || (userAndLastMsg.second && userAndLastMsg.second.content !== null &&
                                                <Typography style={{fontSize: 14, color: '#227ba2'}}>Файл</Typography>)
                                        }
                                        </Grid>
                                        {allMessages.get(userAndLastMsg.first.username) && (allMessages.get(userAndLastMsg.first.username).unRead > 0)
                                        && <Grid>
                                            <Paper
                                                className={classes.noticeMsg}>{allMessages.get(userAndLastMsg.first.username).unRead}
                                            </Paper>
                                        </Grid>}
                                    </Grid>
                                </Grid>
                            </Grid>
                        </ListItemButton>
                        <Divider/>
                    </Link>
                </Grid>
            )))
    }

    /**
     * Функция проверяет есть ли непрочитанные сообщения с выбранным пользователем, если есть,
     * то на сервере статус этих сообщений изменится на READ.
     *
     * P.S. Вызывается каждый раз при отображении полученного сообщения (recipient.msg.component), надо бы оптимизировать.
     */
    function updateStatusMsg() {
        const dataMsg = allMessages.get(selectedUser.username)
        if (dataMsg && dataMsg.unRead > 0) {
            let unreadArr = dataMsg.messages.filter(msg => msg.statusMessage === "UNREAD" && msg.senderName === selectedUser.username && !processedUnreadMessages.includes(msg.id))
            if (unreadArr.length > 0) {
                unreadArr.map(msg => setProcessedUnreadMessages(prevState => (prevState.concat([msg.id]))))
                ChatService.updateStatusUnreadMessages(unreadArr).then()
            }

            // Отнять количество сообщений, которое мы прочитали. Необходимо для того,
            // чтобы на клиенте обновить уведомление о количестве непрочитанных сообщений.
            minusUnRead(dataMsg.unRead)
            dataMsg.unRead = 0
            setAllMessages(prev => (prev.set(selectedUser.username, dataMsg)))
        }
    }

    function createFilesArray() {
        let filesArray = []
        for (let i = 0; i < selectedFiles.length; i++) {
            filesArray.push(selectedFiles[i])
        }
        return filesArray
    }

    function disableButton() {
        if (selectedUser) {
            return !(contentPresence || selectedFiles)
        }
        return true
    }

    /**
     * Функция проверяет выбранные файлы на ограничения:
     * кол-во файлов <= 6, размер <= 50МБ.
     * @param files
     */
    function uploadFiles(files) {
        const MAX_NUM_FILES = 6
        const MAX_SIZE_FILES = 52428800
        let err_files = false
        let filesArray = Array.from(files.target.files)
        if (filesArray.length > MAX_NUM_FILES) {
            filesArray.splice(MAX_NUM_FILES)
            err_files = true
        }
        let removedCount = 0
        const length = filesArray.length
        for (let i = 0; i < length; i++) {
            if (filesArray[i - removedCount].size > MAX_SIZE_FILES) {
                filesArray.splice(i - removedCount, 1)
                removedCount++
                err_files = true
            }
        }
        if (err_files) {
            alert("Кол-во <= 6, размер <= 50МБ")
        }
        if (filesArray.length === 0) {
            filesArray = null
        }
        setSelectedFiles(filesArray)
    }

    function getFiles() {
        AttachmentService.getAttachmentsForUser(
        AuthService.getCurrentUser().username
        ).then(
        (response) => {
            let filteredDicomsForSelect = response.data.map((el) => {
                return { id: el.id, name: el.initialName, uid: el.uid };
            });
            setAllFiles(filteredDicomsForSelect)
        },
        (error) => {
            console.log(error);
        })
    }

    /**
     * Функция проверяет выбранные файлы на ограничение:
     * кол-во файлов <= 6.
     * @param files
     */
    function handleFiles(files) {
        let filesArray = [...files.target.value]
        
        if (filesArray.length > 6) {
            alert("Кол-во файлов должно быть <= 6.")
            filesArray.splice(filesArray.length - 1, 1)
        }
        
        if (filesArray.length === 0) {
            setSelectFiles([])
            setSelectedFiles(null)
        } else {
            setSelectFiles(filesArray)
            setSelectedFiles(filesArray)
        }
    }

    /**
     * Функция закрывает модальное окно
     */
    function acceptButton() {
        setModalShow(false);
    }

    const ITEM_HEIGHT = 48
    const ITEM_PADDING_TOP = 8
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    }

    /**
     * Функция открывает модальное окно
     */
    function handleOpen() {
        setModalShow(true)
    }

    /**
     * Функция закрывает модальное окно и обнуляет выбранные файлы
     */
    function handleClose() {
        setSelectFiles([])
        setSelectedFiles(null)
        setModalShow(false)
    }

    /**
     * Функция удаляет прикрепленные файлы к сообщению
     * @param index 
     */
    function delSelectedFiles(index) {
        let files = [...selectedFiles]
        files.splice(index, 1)
        if(files.length === 0) {
            setSelectFiles([])
            setSelectedFiles(null)
        } else {
            setSelectedFiles(files)
        }
    }

    return (
        <Grid xs={12} item className={classes.mainGrid}>
            <Grid xs={3} item>
                <Card className={classes.paper}>
                    <TextField
                        fullWidth
                        className={classes.inputSearchContacts}
                        minRows={1}
                        maxRows={6}
                        variant="outlined"
                        size="small"
                        id="searchContacts"
                        label="Поиск по контактам..."
                        name="searchContacts"
                        autoComplete="off"
                        value={searchContacts}
                        onChange={(searchContacts) => onChangeSearchContacts(searchContacts)}
                    />
                    <List className={classes.itemButton}>
                        {usersWithLastMsg && sortContacts()}
                    </List>
                </Card>
            </Grid>

            <Grid xs={9} item
                  // onKeyDown={(key) => deactivateChat(key)}
                  // tabIndex={0}
            >
                <Card className={classes.paper2}>
                    {selectedUser &&
                    <Grid>
                        <Grid container>
                            <Grid>
                                <TextField size="small"
                                           fullWidth
                                           className={classes.inputSearchMsg}
                                           variant="outlined"
                                           id="searchContent"
                                           label="Поиск по сообщениям..."
                                           name="searchContent"
                                           autoComplete="off"
                                           value={searchContent}
                                           onChange={(searchContent) => onChangeSearchContent(searchContent)}
                                />
                            </Grid>
                        </Grid>
                        <Paper

                            className={classes.messageGrid}>

                            <Grid>
                                {selectedUser &&
                                    (allMessages.get(selectedUser.username)) &&
                                    ([...allMessages.get(selectedUser.username).messages]
                                        .filter((msg) => msg.content.includes(searchContent))
                                        .map((msg, index) => (

                                    ((((msg.senderName !== selectedUser.username) ||
                                            (msg.senderName === msg.recipientName)) &&
                                        (<SenderMsg msg={msg} key={index} scrollToBottom={scrollToBottom}
                                                       deleteMsgClient={deleteMsgClient}/>
                                        )) || (((msg.senderName === selectedUser.username) &&
                                            (
                                                <RecipientMsg msg={msg} key={index}
                                                              initialsSender={selectedUser.initials}
                                                              updateStatusMsg={updateStatusMsg}
                                                              scrollToBottom={scrollToBottom}
                                                />
                                            ))
                                    ))
                                )))
                                }
                            </Grid>
                            <div ref={messagesEndRef}/>
                        </Paper>

                        <Grid container>
                            <Grid>
                                <DropdownButton
                                    as={ButtonGroup}
                                    key="up"
                                    className={classes.iconInput}
                                    variant="contained"
                                    color="primary"
                                    id="dropdown-button-drop-up"
                                    drop="up"
                                    disabled={!selectedUser}
                                    title={<AttachFileIcon style={{color: "#fff"}}/>}
                                >
                                    <Dropdown.Item
                                    as="button"
                                    variant="contained"
                                    onClick={selectFile}
                                    disabled={!selectedUser}
                                    title={"Прикрепить файл"}
                                    >
                                        <input
                                            type="file"
                                            style={{ display: "none" }}
                                            ref={fileInput}
                                            multiple
                                            onChange={(e) => uploadFiles(e)}
                                        />
                                            С устройства
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                    title={"Прикрепить файл"}
                                    >
                                        <span
                                            is="button"
                                            variant="contained"
                                            onClick={handleOpen}>
                                            Из профиля
                                        </span>
                                        <Modal
                                            show={modalShow}
                                            centered="true"
                                            aria-labelledby="contained-modal-title-vcenter"
                                            onHide={handleClose}
                                        >
                                            <Modal.Body>
                                            <Modal.Header>
                                                <Modal.Title id="contained-modal-title-vcenter">
                                                    Выберите изображения из профиля
                                                </Modal.Title>
                                            </Modal.Header>
                                            <Container component="main">
                                                <main className={classes.layout}>
                                                <Paper className={classes.paper3}>
                                                    <FormControl className={classes.formControl}>
                                                    <InputLabel id="selected-files">Прикрепить файлы</InputLabel>
                                                    <Select
                                                        className={classes.rootSelect}
                                                        multiple
                                                        labelId="selected-files"
                                                        value={selectFiles}
                                                        title={"Прикрепить файлы"}
                                                        onChange={handleFiles}
                                                        input={<Input id="select-multiple-chip-for-files"/>}
                                                        renderValue={(selected) => (
                                                        <div className={classes.chips}>
                                                            {selected.map((value) => (
                                                            <Chip
                                                                key={value}
                                                                label={value.name}
                                                                className={classes.chip}
                                                            />
                                                            ))}
                                                        </div>
                                                        )}
                                                        MenuProps={MenuProps}
                                                    >
                                                        {allFiles.map((x) => (
                                                        <MenuItem key={x.id} value={x} id={x.id}>
                                                            {x.name}
                                                        </MenuItem>
                                                        ))}
                                                    </Select>
                                                    </FormControl>

                                                </Paper>
                                                </main>
                                            </Container>
                                            </Modal.Body>
                                            <Modal.Footer>
                                                <Button onClick={() => acceptButton()}>Принять</Button>
                                                <Button onClick={() => handleClose()}>Отменить</Button>
                                            </Modal.Footer>
                                        </Modal>
                                    </Dropdown.Item>
                                </DropdownButton>
                            </Grid>
                            <Grid>
                                <TextField
                                    className={classes.root}
                                    multiline
                                    minRows={1}
                                    maxRows={6}
                                    variant="outlined"
                                    id="content"
                                    label="Напишите сообщение..."
                                    name="content"
                                    autoComplete="off"
                                    value={content}
                                    onChange={(content) => onChangeMessageContent(content)}
                                    onKeyPress={(key) => checkKey(key)}
                                />
                            </Grid>
                            <Grid>
                                <Button
                                    className={classes.iconInput}
                                    variant="contained"
                                    color="primary"
                                    onClick={sendMessage}
                                    disabled={disableButton()}
                                    title={"Отправить"}
                                >
                                    <SendIcon/>
                                </Button>
                            </Grid>
                            <Grid>
                                {selectedFiles && createFilesArray().map((file, i) => 
                                    <div>
                                        <span>{file.name} {"\n"}</span>
                                        <span as="button"
                                              key={i}
                                              style={{cursor: "pointer", '&:hover': {color: "#fff",},}}
                                              onClick={() => delSelectedFiles(i)}><HighlightOffIcon/></span>
                                    </div>
                                )}
                            </Grid>
                        </Grid>
                    </Grid>}
                </Card>
            </Grid>

        </Grid>

    )
}

export default withStyles(useStyles)(Chat)