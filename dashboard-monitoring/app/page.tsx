import Image from "next/image";

export default function Home() {
  return (
    <div className="h-screen w-screen bg-gray-700 overflow-hidden flex flex-col">

      <header className="shrink-0">
        <div className="bg-teal-500 text-gray-500 flex justify-between items-center px-6 py-10 text-2xl font-bold">
          <span className="text-4xl">10:27:22</span>
          <span className="text-6xl">MAIN ASSY</span>
          <span className="text-4xl">17/07/26</span>
        </div>
      </header>
      
      <div className="m-2"></div>
      
      <main className="flex-1 min-h-0 p4">
        
        <div className="flex gap-4 h-full">
        <div className="m-0.5"></div>

          <div className="w-1/3 flex flex-col gap-4">
            <Box title="Target" value={99} icon="/icon/01_tgt.svg" />
            <Box title="Assy Out" value={99} icon="/icon/02_out.svg" />
            <Box title="EFF" value={99} icon="/icon/03_eff.svg"/>
            <Box title="JPH" value={99} icon="/icon/04_jph.svg"/>
            <Box title="C/T" value={99} icon="/icon/05_ct.svg"/>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {/* <div className=""> */}

              <div className="grid grid-cols-2 gap-4 flex-1">
                <Card title="Quality" freq={20} minutes={5} warning={false}/>
                <Card title="Logistic" freq={20} minutes={5} warning={true}/>
                <Card title="Equipment" freq={20} minutes={5} warning={false}/>
                <Card title="Process"freq={20} minutes={5} warning={false}/>
              </div>

              <div className="bg-gray-600 flex justify-between items-center px-6 md:h-30 text-2xl rounded-[10px]">
                <span></span>
                <span className="text-5xl font-bold">Handover</span>
                <span className="bg-teal-400 text-black text-7xl font-bold text-center md:w-160 py-5 rounded-[10px]">999</span>
              </div>

            {/* </div> */}
          </div>
        <div className="m-1"></div>

        </div>
        
      </main>
      <div className="m-2"></div>
    </div>
  );
}

type BoxProps = {
  title : string,
  value : number,
  icon? :string;
}

function Box({ title, value , icon }: BoxProps) {
  return (
    <div className="bg-gray-600 flex-1 flex justify-between items-center px-6 py-4 text-5xl rounded-[10px]">
      <div className="flex items-center gap-4">
        {icon && (
          // <div className="w-15 h-15 bg-teal-800 rounded-full flex items-center justify-center p-2.5">
            
          //   <img
          //   src={icon}
          //   alt="icon"
          //   className="object-contain"
          //   />
          //   </div>
          // <div className="w-15 h-15 bg-teal-950 rounded-full flex items-center justify-center p-2.5 shadow-lg shadow-black/30 ring-1 ring-white/10">
  
          //   <img
          //     src={icon}
          //     alt="icon"
          //     className="object-contain drop-shadow-[0_0_6px_#223dee]"
          //   />
          // </div>
          <div className="w-15 h-15 bg-gray-800 rounded-full flex items-center justify-center p-2.5 shadow-lg shadow-black/30">
            
            <div className="relative w-8 h-8">
              <div
                className="absolute inset-0 bg-teal-400 blur-md opacity-80"
                style={{
                  WebkitMask: `url(${icon}) no-repeat center / contain`,
                  mask: `url(${icon}) no-repeat center / contain`,
                }}
              />
              <div
                className="w-8 h-8 bg-teal-400"
                style={{
                  WebkitMask: `url(${icon}) no-repeat center / contain`,
                  mask: `url(${icon}) no-repeat center / contain`,
                  filter: "drop-shadow(0 0 6px #39FF14) drop-shadow(0 0 12px #39FF14)",
                }}
                />
              </div>
            </div>          
        )}

      <span className="font-bold">{title}</span>
      </div>
      <span className="bg-teal-400 text-gray-700 text-5xl font-bold w-[250px] h-[100px] flex items-center justify-center rounded-[5px]">
        {value}
      </span>
    </div>
  );
}

type cardProps = {
  title: string,
  freq: number,
  minutes: number,
  warning?: boolean
}

function Card({ title, freq, minutes, warning}: cardProps) {
  return (
    // <div className='bg-gray-600 h-full flex flex-col rounded-[10px] $warning'>
    <div className={`${warning ? "bg-red-950":"bg-gray-600"} ${warning ? "shadow-[0_0_20px_5px_rgba(239,68,68,0.7)] shadow-red-500/50":""} h-full flex flex-col rounded-[10px] ${warning ? "animate-pulse":"animate-none"}`}>
      <div className={`${warning? "bg-red-600": "bg-teal-400"}  ${warning? "text-white": "text-gray-700"} text-center text-4xl font-bold py-8 animate-none rounded-t-[10px]`}>
        {title}
      </div>

      <div className="flex flex-1 justify-evenly items-center text-xl">
        <div className="flex flex-col h-full text-center">
            <div className="text-4xl my-10 mb-1">{warning ? "Station" : "Frequency"}</div>
            <div className="flex-1 flex items-center justify-center">
              <div className={`${warning? "text-red-400": "text-teal-400"} text-7xl`}>{freq}</div>
            </div>
        </div>

        <div className="w-1 bg-gray-500 self-stretch my-5 rounded-full shadow-sm shadow-gray-400/50"></div>
        <div className="flex flex-col h-full text-center">
          <div className="text-4xl my-10 mb-1">Minutes</div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white text-7xl">{minutes}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
