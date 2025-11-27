"use client";

const PacmanLoader = () => {
  const pacmanStyles = `
    .pacman-loader {
      position: relative;
      height: 60px;
      width: 500px;
    }
    .pacman-loader .pacman {
      position: absolute;
      left: 0;
      top: 0;
      height: 60px;
      width: 60px;
      animation: pacWalk 2.5s linear infinite;
      z-index: 10;
      pointer-events: none;
    }
    @keyframes pacWalk {
      0%   { transform: translateX(0); }
      100% { transform: translateX(440px); }
    }
    .pacman-loader .pacman .eye {
      position: absolute;
      top: 10px;
      left: 30px;
      height: 7px;
      width: 7px;
      border-radius: 50%;
      background-color: #1C163A;
      z-index: 10;
    }
    .pacman-loader .pacman span {
      position: absolute;
      top: 0;
      left: 0;
      height: 60px;
      width: 60px;
      transform-origin: 30px 30px;
    }
    .pacman-loader .pacman span::before {
      content: "";
      position: absolute;
      left: 0;
      height: 30px;
      width: 60px;
      background-color: #FFFB16;
    }
    .pacman-loader .pacman .top::before {
      top: 0;
      border-radius: 60px 60px 0 0;
    }
    .pacman-loader .pacman .bottom::before {
      bottom: 0;
      border-radius: 0 0 60px 60px;
    }
    .pacman-loader .pacman .top {
      animation: pacTop 0.25s infinite steps(1);
    }
    @keyframes pacTop {
      0%, 100% { transform: rotate(0deg); }
      50%      { transform: rotate(-35deg); }
    }
    .pacman-loader .pacman .bottom {
      animation: pacBottom 0.25s infinite steps(1);
    }
    @keyframes pacBottom {
      0%, 100% { transform: rotate(0deg); }
      50%      { transform: rotate(35deg); }
    }
    .pacman-loader .letters {
      position: absolute;
      left: 60px;
      top: 0;
      display: flex;
      gap: 12px;
      font-size: 30px;
      font-weight: bold;
      color: #EFEFEF;
      line-height: 60px;
      z-index: 1;
      pointer-events: none;
    }
    .pacman-loader .letters span {
      display: inline-block;
      opacity: 1;
      transform: scale(1);
      animation: shrink 2.5s infinite linear;
      transform-origin: center;
      position: relative;
      visibility: visible;
    }
    @keyframes shrink {
      0%   { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); visibility: visible; }
      0.3% { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); visibility: visible; }
      0.6% { opacity: 0.4; transform: scale(0.7); clip-path: inset(0 40% 0 0); visibility: visible; }
      1%   { opacity: 0; transform: scale(0.3); clip-path: inset(0 100% 0 0); visibility: hidden; }
      97%  { opacity: 0; transform: scale(0.3); clip-path: inset(0 100% 0 0); visibility: hidden; }
      97.4% { opacity: 0.4; transform: scale(0.7); clip-path: inset(0 40% 0 0); visibility: visible; }
      97.7% { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); visibility: visible; }
      100% { opacity: 1; transform: scale(1); clip-path: inset(0 0 0 0); visibility: visible; }
    }
    /* Ajustar delays para que las letras desaparezcan MUCHO ANTES de que el Pacman las alcance */
    /* El Pacman se mueve 440px en 2.5s = 176px/s. Las letras comienzan en 60px. */
    /* Cada letra tiene ~42px de espacio (30px letra + 12px gap) */
    /* Hacemos que desaparezcan 0.4s antes para asegurar que no aparezcan detrás */
    .pacman-loader .letters span:nth-child(1) { animation-delay: -0.06s; } /* M - 60px/176 = 0.34s, menos 0.4s = -0.06s */
    .pacman-loader .letters span:nth-child(2) { animation-delay: 0.18s; } /* U - 102px/176 = 0.58s, menos 0.4s = 0.18s */
    .pacman-loader .letters span:nth-child(3) { animation-delay: 0.42s; } /* L - 144px/176 = 0.82s, menos 0.4s = 0.42s */
    .pacman-loader .letters span:nth-child(4) { animation-delay: 0.66s; } /* T - 186px/176 = 1.06s, menos 0.4s = 0.66s */
    .pacman-loader .letters span:nth-child(5) { animation-delay: 0.90s; } /* I - 228px/176 = 1.30s, menos 0.4s = 0.90s */
    .pacman-loader .letters span:nth-child(6) { animation-delay: 1.13s; } /* C - 270px/176 = 1.53s, menos 0.4s = 1.13s */
    .pacman-loader .letters span:nth-child(7) { animation-delay: 1.37s; } /* I - 312px/176 = 1.77s, menos 0.4s = 1.37s */
    .pacman-loader .letters span:nth-child(8) { animation-delay: 1.46s; } /* B - 354px/176 = 2.01s, menos 0.55s = 1.46s */
    .pacman-loader .letters span:nth-child(9) { animation-delay: 1.60s; } /* E - 396px/176 = 2.25s, menos 0.65s = 1.60s */
    .pacman-loader .letters span:nth-child(10){ animation-delay: 1.84s; } /* R - 438px/176 = 2.49s, menos 0.65s = 1.84s */
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pacmanStyles }} />
      <div className="pacman-loader">
        <div className="letters">
          <span>M</span>
          <span>U</span>
          <span>L</span>
          <span>T</span>
          <span>I</span>
          <span>C</span>
          <span>I</span>
          <span>B</span>
          <span>E</span>
          <span>R</span>
        </div>
        <div className="pacman">
          <span className="top"></span>
          <span className="bottom"></span>
          <div className="eye"></div>
        </div>
      </div>
    </>
  );
};

export default PacmanLoader;

