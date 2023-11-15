<template>
  <div class="flex flex-col w-full justify-center items-center">
    <h1 class="w-full text-3xl font-bold leading-7 text-orange-500  my-4 text-center">
      MineSweeper
    </h1>
    <div class="w-full flex justify-center items-center mb-8 gap-8">
      <div class="flex justify-center items-center h-full md:text-xl text-center text-orange-500 font-bold"
        style="border-color:#7c8a76 #e2e8ce #7c8a76 #e2e8ce;">
        🚩&nbsp;{{ flags }}
      </div>
      <button
        class=" bg-gray-200/25 hover:bg-gray-700 w-8 h-8 rounded overflow-visible text-6xl flex justify-center items-center"
        @click="reset">
        {{ emoji }}
      </button>
      <div class=" h-full md:text-xl text-center text-orange-500 font-bold flex justify-center items-center"
        style="border-color:#7c8a76 #e2e8ce #7c8a76 #e2e8ce;">
        ⏱️&nbsp;{{ timer }}
      </div>
    </div>
    <table class="w-full border-collapse rounded flex overflow-auto">
      <tbody class="flex flex-col  justify-center items-center py-2 px-2  bg-green-200/75 border-4 mx-auto">
        <tr v-for="row, y in state.grid" class="flex  justify-center items-center">
          <td v-for="item, x in row" class="border border-green-200/25
               hover:bg-green-200/25 text-center text-xl w-8 h-8">
            <!-- {{ state[x - 1][y - 1].mine ? "X" : state[x - 1][y - 1].adjacentMines }} -->
            <button class="w-full h-full" v-if="item.revealed">
              <template v-if="item.mine" class="w-full h-full">
                <p class="h-full bg-red-800 flex items-center justify-center sm:py-1 md:py-1 lg:py-0 py-1">💣</p>
              </template>
              <template v-else-if="item.adjacentMines! > 0">
                <p :class="colorOfNumber[item.adjacentMines!]">{{ item.adjacentMines }}</p>
              </template>
            </button>
            <button class="w-full h-full" v-else @click="onClick(x, y)" @contextmenu.prevent="onRightClick(item)"
              @mousedown.middle="onMiddleClick(item)">
              <template v-if="item.flagged">
                <p>🚩</p>
              </template>
              <template v-else-if="item.doubt">
                <p>❓</p>
              </template>
              <template v-else class="w-full h-full">
                <p class="w-full h-full bg-white/25" @mouseenter="nervous()" @mouseleave="relax()" @mouseover="">
                  <!-- &nbsp; -->
                  {{ dev ? item.mine ? '💣' : item.adjacentMines : '&nbsp;' }}
                </p>
              </template>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- level opt -->
    <div class="text-md text-center">
      Count: {{ unrevealed }}
      <!-- wrap  a line-->
      <br />
      {{ help }}
    </div>
    <div class="my-4 flex justify-center items-center gap-4">
      <button class="rounded-full bg-teal-600 hover:bg-teal-700 px-4 border-dashed border-b text-xs md:text-md lg:text-lg"
        @click="changeLevel(5, 4)">EASY</button>
      <button class="rounded-full bg-teal-600 hover:bg-teal-700 px-4 border-dashed border-b text-xs md:text-md lg:text-lg"
        @click="changeLevel(10, 10)">MEDIUM</button>
      <button class="rounded-full bg-teal-600 hover:bg-teal-700 px-4 border-dashed border-b text-xs md:text-md lg:text-lg"
        @click="changeLevel(15, 20)">HARD</button>
      <button class="rounded-full bg-teal-600 hover:bg-teal-700 px-4 border-dashed border-b text-xs md:text-md lg:text-lg"
        @click="devMode()">DEV</button>
    </div>
    <!-- need a footer with github icon -->
    <div class="flex justify-center items-center gap-4">
      <a href="https://github.com/yongruifang/minesweeper"
        class="icon-[carbon--logo-github] w-10 h-10 hover:bg-white"></a>
    </div>
    <Confetti :passed="win" />
  </div>
</template>
<script setup lang="ts">
import Confetti from './components/Confetti.vue';
import { onMounted, ref, reactive, watch } from 'vue';
interface BlockState {
  x: number,
  y: number,
  revealed?: boolean;
  mine?: boolean;
  flagged?: boolean;
  doubt?: boolean;
  adjacentMines?: number;
}
const BOMB = -1;
const SAFE = 0;
//getShuffled game array with mines
const getShuffled = (size: number, mines: number): Number[] => {
  const mineArray = Array(mines).fill(BOMB);
  const emptyArray = Array(size * size - mines).fill(SAFE);
  const gameArray = emptyArray.concat(mineArray);
  const shuffled = gameArray.sort(() => Math.random() - 0.5);
  return shuffled;
};
const size = ref(10);
const unrevealed = ref(size.value * size.value);
const state = reactive(
  {
    grid: Array.from({ length: size.value }, (_, y) =>
      Array.from({ length: size.value },
        (_, x): BlockState => {
          return {
            x: x,
            y: y,
            revealed: false,
            mine: false,
            flagged: false,
            doubt: false,
            adjacentMines: 0,
          };
        }
      ),
    )
  }
)
const mineAmount = ref(10);
const emoji = ref('🙂');
// the amount of flags
const flags = ref(mineAmount.value);
// timer
const timer = ref(60);
// timer start or not
const timerStart = ref(false);
// interval id
const intervalId = ref(0);
// game over or not
const gameOver = ref(false);
const win = ref(false);
// dev mode
const dev = ref(false);
const help = ref('')

const devMode = () => {
  dev.value = !dev.value
}
const reset = () => {
  // clear
  state.grid = Array.from({ length: size.value }, (_, y) =>
    Array.from({ length: size.value },
      (_, x): BlockState => {
        return {
          x: x,
          y: y,
          revealed: false,
          mine: false,
          flagged: false,
          doubt: false,
          adjacentMines: 0,
        };
      }
    ),
  )
  emoji.value = '🙂';
  help.value = ''
  const arr = getShuffled(size.value, mineAmount.value);
  for (let i = 0; i < arr.length; i++) {
    const x = i % size.value;
    const y = Math.floor(i / size.value);
    if (arr[i] === BOMB) {
      state.grid[y][x].mine = true;
    }
  }
  // traverse the array and count adjacent mines
  for (let y = 0; y < size.value; y++) {
    for (let x = 0; x < size.value; x++) {
      if (state.grid[y][x].mine) {
        continue;
      }
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (y + i < 0 || y + i >= size.value || x + j < 0 || x + j >= size.value) {
            continue;
          }
          if (state.grid[y + i][x + j].mine) {
            count++;
          }
        }
      }
      state.grid[y][x].adjacentMines = count;
    }
  }
  flags.value = mineAmount.value;
  clearInterval(intervalId.value)
  timerStart.value = false;
  timer.value = 60;
  gameOver.value = false;
  unrevealed.value = size.value * size.value;
}
// @TODO: reactive not response when size and mineAmount change
const changeLevel = (sz: number, bomb: number) => {
  size.value = sz;
  mineAmount.value = bomb;
  reset();
}
const onClick = (x: number, y: number) => {
  if (gameOver.value) {
    return;
  }
  if (!timerStart.value) {
    timerStart.value = true;
    intervalId.value = setInterval(() => {
      timer.value--;
    }, 1000);
  }
  if (state.grid[y][x].revealed) {
    return;
  }
  if (state.grid[y][x].flagged) {
    flags.value++; // cancel flag
  }
  state.grid[y][x].revealed = true;
  unrevealed.value -= 1;
  if (state.grid[y][x].mine) {
    emoji.value = '😵';
    help.value = 'Pick a mine! You Lose!'
    clearInterval(intervalId.value);
    gameOver.value = true;
  } else {
    expand(x, y)
  }
}
// expand x , y
const expand = (x: number, y: number) => {
  if (state.grid[y][x].adjacentMines! > 0) {
    return;
  }
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (y + i < 0 || y + i >= size.value || x + j < 0 || x + j >= size.value) {
        continue;
      }
      if (state.grid[y + i][x + j].revealed) {
        continue;
      }
      state.grid[y + i][x + j].revealed = true;
      unrevealed.value--;
      if (state.grid[y + i][x + j].adjacentMines === 0) {
        expand(x + j, y + i);
      }
    }
  }
}
const colorOfNumber = [
  'text-blue-500',
  'text-green-500',
  'text-red-500',
  'text-purple-500',
  'text-yellow-500',
  'text-pink-500',
  'text-indigo-500',
  'text-gray-500',
]
// handle right click
const onRightClick = (item: BlockState) => {
  if (gameOver.value) {
    return;
  }
  if (item.flagged) {
    item.flagged = false;
    item.doubt = true;
    flags.value++;
  } else if (item.doubt) {
    item.doubt = false;
  } else {
    item.flagged = true;
    flags.value--;
  }
}
// handle middle click
const onMiddleClick = (item: BlockState) => {
  if (gameOver.value) {
    return;
  }
  if (item.doubt) {
    item.doubt = false;
  } else {
    item.doubt = true;
  }
}
const nervous_timer = ref(0);
const throttle = (func: Function, wait: number) => {
  if (nervous_timer.value == 0) {
    nervous_timer.value = setTimeout(() => {
      nervous_timer.value = 0;
      func();
    }, wait);
  }
}
const nervous = () => {
  throttle(() => {
    if (!gameOver.value) emoji.value = '🫣';
  }, 300)
}
const relax = () => {
  clearTimeout(nervous_timer.value);
  nervous_timer.value = 0;
  if (!gameOver.value) emoji.value = '🙂';
}
// watch unrevealed , when it is equal to mineAmount, win
watch(unrevealed, (newVal) => {
  if (newVal === mineAmount.value) {
    emoji.value = '🥳';
    clearInterval(intervalId.value);
    help.value = 'congratulations! You Win!'
    gameOver.value = true;
    win.value = true
  }
})
watch(timer, (newVal) => {
  if (newVal === 0) {
    // clear timer
    clearInterval(intervalId.value);
    emoji.value = '😵';
    help.value = 'Time Out! You Lose!'
    gameOver.value = true;
  }
})
onMounted(() => {
  reset()
})
</script>