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

// Hàm xử lý khi chụp ảnh và nhận diện khuôn mặt
function handleCapture() {
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
                        const randomGem = gems[Math.floor(Math.random() * gems.length)];
                        smileResult.innerText = `Khuôn mặt được nhận diện! Bạn nhận được một viên đá quý: ${randomGem.name}`;
                        gemDisplay.innerHTML = `<img src="${randomGem.image}" alt="${randomGem.name}">`;

                        // Đặt màu của thông báo dựa trên loại đá quý
                        let color;
                        switch(randomGem.name) {
                            case 'Diamond':
                                color = 'blue';
                                break;
                            case 'Ruby':
                                color = 'red';
                                break;
                            case 'Emerald':
                                color = 'green';
                                break;
                            case 'Sapphire':
                                color = 'sapphireblue';
                                break;
                            default:
                                color = 'black';
                        }
                        smileResult.style.color = color;
                    });
            } else {
                smileResult.innerText = "Không nhận diện được khuôn mặt.";
                gemDisplay.innerHTML = "";
                smileResult.style.color = 'black';
            }
        })
        .catch(error => console.error('Error:', error));
}

// Gắn sự kiện click cho nút chụp ảnh
captureButton.addEventListener('click', handleCapture);
