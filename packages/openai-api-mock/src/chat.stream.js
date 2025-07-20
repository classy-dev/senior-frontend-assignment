import { Readable } from 'node:stream';
import { getSteamChatObject, cleanupStream } from './utils/responseGenerators.js'
import { faker } from '@faker-js/faker';

export function createChatStream(requestBody, req) {
    const stream = new Readable({
        read() { }
    });

    // 각 스트림에 고유 ID 생성
    const streamId = `chatcmpl-${faker.string.alphanumeric(30)}`;
    let count = 0;
    const maxCount = 500; // 충분히 많은 청크 수로 설정
    let timeoutId = null;
    let isAborted = false;

    // Handle abort signal if present
    if (req && req.on) {
        req.on('close', () => {
            isAborted = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            // 스트림 상태 정리
            cleanupStream(streamId);
            stream.push(null);
        });
    }

    function sendData() {
        if (isAborted) {
            cleanupStream(streamId);
            return;
        }

        timeoutId = setTimeout(() => {
            if (isAborted) {
                cleanupStream(streamId);
                return;
            }

            if (count === 0) {
                // 첫 청크에서 스트림 리셋
                stream.push(`data: ${getSteamChatObject(requestBody.messages, true, streamId)}\n\n`);
            } else {
                const chunk = getSteamChatObject(requestBody.messages, false, streamId);
                const parsedChunk = JSON.parse(chunk);
                
                stream.push(`data: ${chunk}\n\n`);
                
                // finish_reason이 "stop"이면 종료
                if (parsedChunk.choices[0].finish_reason === "stop") {
                    stream.push(`data: [DONE]\n\n`);
                    stream.push(null);
                    return;
                }
                
                // 최대 청크 수에 도달하면 강제 종료
                if (count >= maxCount - 1) {
                    stream.push(`data: [DONE]\n\n`);
                    stream.push(null);
                    cleanupStream(streamId);
                    return;
                }
            }
            count++;
            if (!isAborted) {
                sendData();
            }
        }, 50); // 더 빠른 타이핑 효과 (50ms)
    }

    sendData(); // Start sending data

    return stream;
}