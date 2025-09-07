'use client';

import { useState, useEffect,useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const Header = ({
  onRandom,
  mode,
  onhandleInput,
  toggleMode,
}: {
  onRandom: () => void;
  onhandleInput: (str: string) => void;
  mode: boolean;
  toggleMode: () => void;
}) => (
  <div className="flex h-10 w-full items-center justify-between">
    <div className="text-lg font-bold">词云</div>
    <div>
      <input className=' border-red border-2 border-soild p-1' 
      onKeyDown={(e)=>{
        if(e.key==='Enter'){
          onhandleInput(e.target.value)
        }
      }}
      type="text" placeholder="输入关键词"></input>
    </div>
    <div className="flex items-center gap-4">
      <button
        onClick={onRandom}
        className="rounded-md bg-sky-500/30 
        
        px-3 py-1 text-sm text-white shadow hover:bg-sky-600"
      >
        随机
      </button>
      <button
        onClick={toggleMode}
        className="rounded-md bg-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-300"
      >
        {mode ? 'AI词' : '划词'}
      </button>
    </div>
  </div>
);

const SkeletonWord = () => (
  <div className="relative w-full h-[14px] m-1.5 overflow-hidden rounded-md bg-neutral-800">

    <div className="absolute top-0 left-[-100%] h-full w-1/2 bg-gradient-to-r from-transparent via-neutral-200 to-transparent animate-[sweep_1.6s_ease-in-out_infinite]" />
    <style jsx>{`
      @keyframes sweep {
        0%   { left: -100%; }
        100% { left: 100%;  }
      }
    `}</style>
  </div>
);

// 计时器：返回 start / end 两个方法
const createTimer = () => {
  let startTime: number | null = null;

  return {
   
    start(label = 'api-call') {
      startTime = performance.now();
      console.time(label);      
      return startTime;
    },

    end(label = 'api-call') {
      if (startTime === null) {
        throw new Error('Timer not started');
      }
      const cost = performance.now() - startTime;
      console.timeEnd(label);    
      console.log(cost);
      
      startTime = null;
      return cost;    
    },
  };
};
export default function Home() {
  const [article, setArticle] = useState<string[]>([]);
  // const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [endtimd,setEndtime]=useState<number>()
  const searchParams = useSearchParams();
  const router = useRouter();
  const keyword = searchParams?.get('wd') || 'Theo';
  const timer = createTimer();
  const reHasSpecial = /[^\p{L}\p{N}_]/u;
  const Feckword = ['你', '我', '的', '啦', '哦', '将', '与'];
  const doubao = useCallback(async (key: string) => {
    // setLoading(true);
    setArticle([]);
    setStreamingText(''); 
    
        try {
          timer.start('doubao')
      const response = await fetch('/api/doubao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: key }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }else{
         setEndtime(timer.end('doubao'))
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
    
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }

            try {
              const data = JSON.parse(dataStr);

              if (data.type === 'chunk') {
                // 实时更新流式文本显示
                fullText += data.content;
                setStreamingText(fullText);
              } else if (data.type === 'complete') {
                // 流结束，调用分词API进行处理
                try {
                  const segmentResponse = await fetch('/api/segment', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: data.fullText }),
                  });

                  if (segmentResponse.ok) {
                    const { segments } = await segmentResponse.json();
                    setArticle(segments);
                  } else {
                    console.error('Segmentation failed');
                 
                    setArticle(data.fullText.split(''));
                  }
                } catch (segmentError) {
                  console.error('Segmentation error:', segmentError);
                
                  setArticle(data.fullText.split(''));
                }
                setStreamingText(''); 
                break;
              } else if (data.type === 'error') {
                console.error('Stream error:', data.error);
                break;
              }
            } catch (e) {
              console.error('Failed to parse JSON:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setArticle([]);
      setStreamingText('');
    } finally {
      // setLoading(false);
    }
  },[]);

  useEffect(() => {
    if (keyword) doubao(keyword);
  }, [keyword,doubao]);

  const handleRandom = (str: string[]) => {
    const wordList = str;
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    router.push(`/?wd=${encodeURIComponent(randomWord)}`);
  };
  const handleInput= (str: string) => {
    router.push(`/?wd=${encodeURIComponent(str)}`);
  }


  const [mode, setMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  // 处理文本选择的函数
  const handleTextSelection = useCallback(() => {
    if (!mode) return; // 只在划词模式下工作
    
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      setIsSelecting(true);
      // 添加短暂延迟以显示选中反馈
      setTimeout(() => {
        // 更新URL参数并调用API
        router.push(`/?wd=${encodeURIComponent(selectedText)}`);
        setIsSelecting(false);
      }, 200);
    }
  }, [mode, router]);

  // 添加文本选择事件监听器和样式
  useEffect(() => {
    if (mode) {
      // 确保在整个文档范围内监听文本选择
      document.addEventListener('mouseup', handleTextSelection, true);
      document.addEventListener('touchend', handleTextSelection, true);
      // 添加选择变化监听器
      document.addEventListener('selectionchange', handleTextSelection, true);
      
      // 添加全局样式使文本可选择
      document.body.style.userSelect = 'text';
      document.body.style.webkitUserSelect = 'text';
      document.body.style.cursor = 'text';
    } else {
      document.removeEventListener('mouseup', handleTextSelection, true);
      document.removeEventListener('touchend', handleTextSelection, true);
      document.removeEventListener('selectionchange', handleTextSelection, true);
      
      // 恢复默认样式
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mouseup', handleTextSelection, true);
      document.removeEventListener('touchend', handleTextSelection, true);
      document.removeEventListener('selectionchange', handleTextSelection, true);
      
      // 清理样式
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.cursor = '';
    };
  }, [mode, handleTextSelection]);

  return (
    <div className={`relative mx-auto w-[90vw] max-w-3xl py-10 sm:w-[60vw] ${
      mode ? 'cursor-text select-text' : ''
    }`}>
      <Header
        onRandom={() => handleRandom(article.filter((item) => item.length > 1))}
        mode={mode}
        onhandleInput={(e)=>handleInput(e)}
        toggleMode={() => setMode(!mode)}
      />
     <h1 className='text-xl text-center mt-10'>
      {keyword}
     </h1>
     
     {mode && (
       <div className="text-center mt-2 text-sm text-gray-500">
         {isSelecting ? (
           <span className="animate-pulse">🔍 正在处理选中的文本...</span>
         ) : (
           <span>💡 划词模式：选中页面文字即可查询</span>
         )}
       </div>
     )}

      <div className={`mt-3 leading-loose ${
        mode ? 'select-text cursor-text' : ''
      }`}>
        {streamingText ? (
          <div className={`text-gray-800 whitespace-pre-wrap ${
            mode ? 'select-text cursor-text' : ''
          }`}>
            {streamingText}
            <span className="inline-block w-2 h-5 bg-gray-400 animate-pulse ml-1" />
          </div>
        ) : article.length > 0 ? (

          article.map((item, idx) =>
            !reHasSpecial.test(item) && !Feckword.includes(item) ? (

              <a
                key={idx}
                href={`/?wd=${encodeURIComponent(item)}`}
                className={`hover:bg-sky-200 ${
                  mode ? 'select-text cursor-text' : ''
                }`}
              >
                {item}
              </a>
            ) : (
              <span key={idx} className={`inline-block ${
                mode ? 'select-text cursor-text' : ''
              }`}>
                {item}
              </span>
            )
          )
        ) : (

          Array.from({ length: 20 }, (_, idx) => (
            <SkeletonWord key={`s-${idx}`} />
          ))
        )}
      </div>

      <div className='w-full mt-10 text-sm  gap-3 text-slate-400  flex justify-end'>
      <div>{
        !streamingText&&endtimd?<>约 {endtimd?.toFixed(2)}ms</>:<></>}</div>
      <a  className='hover:text-blue-400'  href='https://q-theo-me.vercel.app'>@theo</a>
      <a  className='hover:text-blue-400' href='https://github.com/Theoool'>github</a>
      </div>
    </div>
  );
}
