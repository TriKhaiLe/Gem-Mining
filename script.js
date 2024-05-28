const video = document.getElementById('video');
const captureButton = document.getElementById('capture-button');
const snapshot = document.getElementById('snapshot');
const smileResult = document.getElementById('smile-result');
const gemDisplay = document.getElementById('gem-display');
const frame = document.getElementById('frame');
const copyButton = document.getElementById('copyButton');
const saveButton = document.getElementById('saveButton');
const toast = document.getElementById('toast');
const clickCount = document.getElementById('click-count');
const itemsList = document.getElementById('items-list');
const timeInfo = document.getElementById('current-time');
const probabilityList = document.getElementById('probability-list');

let clickCounter = 0;
let itemsReceived = {};

// Yêu cầu quyền truy cập camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.error("Error accessing webcam: ", error);
    });

// Load face-api.js models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
]).then(startVideo);

// Start video
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => console.error(err));
}

// Hàm lấy khung hình từ video
function captureFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
}

// Hàm chuyển đổi base64 thành Blob
function base64ToBlob(base64) {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeString });
}

// Hàm kiểm tra khuôn mặt
async function detectFace(imageData) {
    const blob = base64ToBlob(imageData);
    const img = await faceapi.bufferToImage(blob);
    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
    return detections.length > 0;
}

// Hàm lấy thông tin đá quý từ API
function getGem() {
    return fetch('gems.json')
        .then(response => response.json());
}

// Hàm chọn ngẫu nhiên đá quý hoặc củ khoai lang
function getRandomItem(items) {
    const cumulativeWeights = items.reduce((acc, item) => {
        const last = acc.length ? acc[acc.length - 1] : 0;
        return [...acc, last + item.probability];
    }, []);
    const random = Math.random();
    return items[cumulativeWeights.findIndex(cumulativeWeight => random < cumulativeWeight)];
}

// Hàm cập nhật danh sách vật phẩm nhận được
function updateItemsList() {
    itemsList.innerHTML = '';
    for (const [item, count] of Object.entries(itemsReceived)) {
        const listItem = document.createElement('li');
        listItem.textContent = `${item}: ${count}`;
        itemsList.appendChild(listItem);
    }
}

// Hàm cập nhật danh sách tỷ lệ xuất hiện
function updateProbabilityList(items) {
    probabilityList.innerHTML = '';
    items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = `${item.name}: ${item.probability * 100}%`;
        probabilityList.appendChild(listItem);
    });
}

// Hàm xử lý khi chụp ảnh và nhận diện khuôn mặt
function handleCapture() {
    // Vô hiệu hóa nút chụp ảnh
    captureButton.disabled = true;
    captureButton.classList.add('spinning');

    const imageData = captureFrame(video);

    // Hiển thị ảnh chụp lên canvas
    const context = snapshot.getContext('2d');
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
        context.drawImage(img, 0, 0, snapshot.width, snapshot.height);
        snapshot.style.display = 'block';
    };

    detectFace(imageData)
        .then(detected => {
            if (detected) {
                getGem()
                    .then(gems => {
                        const randomGem = getRandomItem(gems);
                        const gemClassName = randomGem.name.toLowerCase().replace(/ /g, '-');
                        smileResult.className = `smile-result ${gemClassName}`;
                        snapshot.className = `snapshot ${gemClassName}`;
                        gemDisplay.className = `gem-display ${gemClassName}`;

                        smileResult.innerText = `Khuôn mặt được nhận diện! Bạn nhận được: ${randomGem.name}`;
                        gemDisplay.innerHTML = `<img src="${randomGem.image}" alt="${randomGem.name}" class="${gemClassName}">`;

                        if (itemsReceived[randomGem.name]) {
                            itemsReceived[randomGem.name] += 1;
                        } else {
                            itemsReceived[randomGem.name] = 1;
                        }
                        clickCounter += 1;
                        clickCount.textContent = `Số lượt nhận dạng thành công: ${clickCounter}`;
                        updateItemsList();
                        updateProbabilityList(gems);
                    }).finally(() => {
                        captureButton.classList.remove('spinning');
                        // Kích hoạt lại nút chụp ảnh sau khi xử lý xong
                        captureButton.disabled = false;
                    });
            } else {
                smileResult.innerText = "Không nhận diện được khuôn mặt.";
                gemDisplay.innerHTML = "";
                smileResult.className = "smile-result";
                snapshot.className = "snapshot";
                gemDisplay.className = "gem-display";
                captureButton.classList.remove('spinning');
                // Kích hoạt lại nút chụp ảnh sau khi xử lý xong
                captureButton.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            captureButton.classList.remove('spinning');
            // Kích hoạt lại nút chụp ảnh sau khi xử lý xong
            captureButton.disabled = false;
        });
}

// Gắn sự kiện click cho nút chụp ảnh
captureButton.addEventListener('click', handleCapture);

// Hàm hiển thị toast
function showToast(message) {
    toast.innerText = message;
    toast.className = "toast show";
    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

// Hàm sao chép hình ảnh từ toàn bộ body vào clipboard
function copyFrameToClipboard() {
    html2canvas(document.body).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => {
                showToast('Hình ảnh đã được sao chép vào clipboard.');
            }).catch(error => {
                console.error('Sao chép hình ảnh thất bại:', error);
            });
        });
    });
}

// Gắn sự kiện click cho nút sao chép
copyButton.addEventListener('click', copyFrameToClipboard);

// Hàm lưu hình ảnh từ toàn bộ body về máy
function saveFrameToFile() {
    html2canvas(document.body).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'screenshot.png';
        link.click();
        showToast('Hình ảnh đã được lưu về máy.');
    });
}

// Gắn sự kiện click cho nút lưu ảnh
saveButton.addEventListener('click', saveFrameToFile);

// Thêm chức năng xếp gọn/mở rộng danh sách tỷ lệ xuất hiện
const toggleProbabilityListButton = document.getElementById('toggle-probability-list');
const probabilityListContainer = document.getElementById('probability-list-container');

toggleProbabilityListButton.addEventListener('click', () => {
    if (probabilityListContainer.classList.contains('collapsed')) {
        probabilityListContainer.classList.remove('collapsed');
        toggleProbabilityListButton.textContent = 'Xếp gọn';
    } else {
        probabilityListContainer.classList.add('collapsed');
        toggleProbabilityListButton.textContent = 'Mở rộng';
    }
});


// Cập nhật thời gian hiện tại
function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const currentTime = `${formattedHours}:${formattedMinutes} ${ampm}`;

    const day = now.getDate();
    const month = now.getMonth() + 1; // Tháng bắt đầu từ 0
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    timeInfo.textContent = `${formattedDate} ${currentTime}`;
}

updateTime();
setInterval(updateTime, 60000); // Cập nhật mỗi phút
