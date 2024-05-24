const video = document.getElementById('video');
const captureButton = document.getElementById('capture');
const snapshot = document.getElementById('snapshot');
const smileResult = document.getElementById('smile-result');
const gemDisplay = document.getElementById('gem-display');

// Yêu cầu quyền truy cập camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.error("Error accessing webcam: ", error);
    });

// Hàm lấy khung hình từ video
function captureFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
}

// Hàm giả lập gửi ảnh đến API nhận diện khuôn mặt
function detectFace(imageData) {
    // Giả lập phản hồi từ API
    return new Promise((resolve) => {
        setTimeout(() => {
            const detected = Math.random() > 0.5; // Giả lập tỉ lệ nhận diện khuôn mặt 50%
            resolve({ detected });
        }, 1000);
    });
}

// Hàm lấy thông tin đá quý từ API
function getGem() {
    return fetch('gems.json')
        .then(response => response.json());
}

// Hàm chọn ngẫu nhiên đá quý hoặc củ khoai lang
function getRandomItem(items) {
    const weights = items.map(item => item.name === "Củ khoai lang" ? 0.7 : 0.075);
    const cumulativeWeights = weights.reduce((acc, weight) => {
        const last = acc.length ? acc[acc.length - 1] : 0;
        return [...acc, last + weight];
    }, []);
    const random = Math.random();
    return items[cumulativeWeights.findIndex(cumulativeWeight => random < cumulativeWeight)];
}

// Hàm xử lý khi chụp ảnh và nhận diện khuôn mặt
function handleCapture() {
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
        .then(data => {
            if (data.detected) {
                getGem()
                    .then(gems => {
                        const randomGem = getRandomItem(gems);
                        const gemClassName = randomGem.name.toLowerCase().replace(/ /g, '-');
                        smileResult.className = `smile-result ${gemClassName}`;
                        snapshot.className = `snapshot ${gemClassName}`;
                        gemDisplay.className = `gem-display ${gemClassName}`;

                        smileResult.innerText = `Khuôn mặt được nhận diện! Bạn nhận được: ${randomGem.name}`;
                        gemDisplay.innerHTML = `<img src="${randomGem.image}" alt="${randomGem.name}" class="${gemClassName}">`;
                        captureButton.classList.remove('spinning');
                    });
            } else {
                smileResult.innerText = "Không nhận diện được khuôn mặt.";
                gemDisplay.innerHTML = "";
                smileResult.className = "smile-result";
                snapshot.className = "snapshot";
                gemDisplay.className = "gem-display";
                captureButton.classList.remove('spinning');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            captureButton.classList.remove('spinning');
        });
}

// Gắn sự kiện click cho nút chụp ảnh
captureButton.addEventListener('click', handleCapture);

// Hàm chuyển đổi RGB sang HEX
function rgbToHex(r, g, b) {
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
}

// Khai báo biến lưu trữ đối tượng ClipboardJS
let clipboard;

// Hàm sao chép hình ảnh từ khung div vào clipboard
function copyFrameToClipboard() {
    html2canvas(frame).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => {
                console.log('Hình ảnh đã được sao chép vào clipboard.');
            }).catch(error => {
                console.error('Sao chép hình ảnh thất bại:', error);
            });
        });
    });
}

// Gắn sự kiện click cho nút sao chép
copyButton.addEventListener('click', copyFrameToClipboard);

