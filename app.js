let moveCount = 0;
class Field{
    cellStorage = new Array;
    lightCheckers = new Array;
    darkCheckers = new Array;
    fieldBody;
    constructor(){   
        this.fieldBody = document.createElement("div");
        this.fieldBody.classList.add("field");
        document.body.append(this.fieldBody);    
    }

    fillWithCells(){
        for (let stringIndex = 0; stringIndex < 8; stringIndex++){
            let cellString = new Array;
            for(let columnIndex = 0; columnIndex < 8; columnIndex++){
                let color = ((stringIndex + columnIndex) % 2 == 0) ? "light" : "dark";
                let cell = new Cell(color);
                cell.stringIndex = stringIndex;
                cell.columnIndex = columnIndex;
                cellString.push(cell);
            }
            this.cellStorage.push(cellString);
        }
    }

    fillInitiallyWithCheckers(){
        this.cellStorage.forEach((cellString)=>{
            let stringIndex = this.cellStorage.indexOf(cellString);
            cellString.forEach((cell)=>{
                if(cell.isDark() && stringIndex < 3){
                    let check = new Check("lightCheck");
                    this.lightCheckers.push(check);
                    cell.insertCheck(check);
                } else if(cell.isDark() && stringIndex > 4){
                    let check = new Check("darkCheck");
                    this.darkCheckers.push(check);
                    cell.insertCheck(check);
                }
            })
        })
    }

    resetAcceptableCells(){
        this.cellStorage.forEach((cellString)=>{
            cellString.forEach((cell)=>{
                if(cell.isAcceptable()){ 
                    let newCellBody = document.createElement("div");
                    newCellBody.className = "cell dark";
                    this.fieldBody.replaceChild(newCellBody, cell.cellBody);
                    cell.cellBody.remove();
                    cell.cellBody = newCellBody;
                 };    
            })
        })
    }

    blurPreviouslySelectedChecker(){
        let selectedElements = document.getElementsByClassName("selected");
        if(selectedElements.length > 0){
            let selectedElement = selectedElements[0];
            selectedElement.classList.remove("selected");
        }
    }

    cellByIndex(index){
        let stringIndex = Math.floor(index/8);
        let columnIndex = index % 8;
        return this.cellStorage[stringIndex][columnIndex];
    }

    clearActivatableCheckers(){
        this.darkCheckers.forEach((check)=>{
            check.checkBody.removeEventListener("click", check.prepareForAction)
        })
        this.lightCheckers.forEach((check)=>{
            check.checkBody.removeEventListener("click", check.prepareForAction)
        })
    }

    reActivateCheckers(){
        this.clearActivatableCheckers();
        ++moveCount
        if (moveCount % 2 == 0){
            this.reActivate(this.darkCheckers);
        } else {
            this.reActivate(this.lightCheckers);
        }
    }
    
    reActivate(checkerSet){
        let anybodyCanEat = false;
        checkerSet.forEach((check)=>{
            if(check.canEat()){
                anybodyCanEat = true;
            }       
        })
        if(anybodyCanEat){
            checkerSet.forEach((check)=>{
                if(check.canEat()){
                    check.makeActivatable();
                    // check.checkForMultipleEating();
                }    
            })
        } else {
            checkerSet.forEach((check)=>{
                if(check.canMove()){
                    check.makeActivatable(); 
                }
            })
        }
    }
}

class Cell {
    columnIndex;
    stringIndex;
    cellBody = document.createElement("div");
    innerCheck;
    neighbours;

    constructor(color){
        this.color = color;
        let body = this.cellBody;
        body.className += 'cell';
        document.getElementsByClassName("field")[0].appendChild(body);
        this.addClass(color);
    }

    isDark(){
        return this.cellBody.classList.contains("dark");
    }

    isAcceptable(){
        return this.cellBody.classList.contains("acceptable");
    }

    addClass(text){
        this.cellBody.classList.add(text);
    }

    removeClass(text){
        this.cellBody.classList.remove(text);
    }
  
    insertCheck(check){
        this.cellBody.appendChild(check.checkBody);
        field.blurPreviouslySelectedChecker();
        check.parentCell = this;
        this.innerCheck = check;
    }
    
    isEmpty(){
        return !this.cellBody.hasChildNodes();
    }

    clear(){
        this.cellBody.removeChild(this.innerCheck.checkBody);
    }

    containsDarkCheck(){
        return !this.isEmpty() && this.innerCheck.isDark();
    }

    containsLightCheck(){
        return !this.isEmpty() && this.innerCheck.isLight();
    }

    findNeighbour(direction){
        switch(direction){
            case "nw":
                return (this.stringIndex - 1) * 8 + (this.columnIndex - 1);
            case "ne":
                return (this.stringIndex - 1) * 8 + (this.columnIndex + 1);
            case "sw":
                return (this.stringIndex + 1) * 8 + (this.columnIndex - 1);
            case "se":
                return (this.stringIndex + 1) * 8 + (this.columnIndex + 1);
        }
    }

    findNeighboursToMove(){
        let neighboursIndexesSum = new Array();
        if(this.containsDarkCheck()){
            if(this.columnIndex == 0){
                neighboursIndexesSum.push(this.findNeighbour("ne"));
            } else if (this.columnIndex == 7){
                neighboursIndexesSum.push(this.findNeighbour("nw"));
            } else {
                neighboursIndexesSum.push(this.findNeighbour("nw"), this.findNeighbour("ne"));
            }
        } else if(this.containsLightCheck()){
            if(this.columnIndex == 0){
                neighboursIndexesSum.push(this.findNeighbour("se"));
            } else if (this.columnIndex == 7){
                neighboursIndexesSum.push(this.findNeighbour("sw"));
            } else {
                neighboursIndexesSum.push(this.findNeighbour("sw"), this.findNeighbour("se"));
            }
        }
        return neighboursIndexesSum;
    }

    pickDirectionRelatively(anotherCell){
        let direction;
        let indexDelta = this.getIndex()-anotherCell.getIndex();
        switch(indexDelta){
            case 7:
                direction = 'sw';
                break;
            case 9:
                direction = 'se';
                break;
            case -7:
                direction = 'ne';
                break;
            case -9:
                direction = 'nw';
                break;
        }
        return direction;
    }

    findNeighboursToEat(){
        let neighboursIndexesSum = new Array();
        neighboursIndexesSum.push(this.findNeighbour("sw"), this.findNeighbour("se"), this.findNeighbour("nw"), this.findNeighbour("ne"));
        function popValue(value){
            let index = neighboursIndexesSum.indexOf(value);
            if(index != -1){
                neighboursIndexesSum.splice(index, 1);
            }
            
        }
        switch(this.columnIndex){
            case 0:
            case 1:
                popValue(this.findNeighbour("nw"));
                popValue(this.findNeighbour("sw"));
                break;
            case 6:
            case 7:
                popValue(this.findNeighbour("ne"));
                popValue(this.findNeighbour("se"));
                break;
        }
        switch(this.stringIndex){
            case 0:
            case 1:
                popValue(this.findNeighbour("nw"));
                popValue(this.findNeighbour("ne"));
                break;
            case 6:
            case 7:
                popValue(this.findNeighbour("sw"));
                popValue(this.findNeighbour("se"));
                break;
        }
        return neighboursIndexesSum;
    }

    getIndex(){
        return this.stringIndex * 8 + this.columnIndex;
    }

    isFilledWithEnemyCheckerInComparisonTo(anotherCell){
        return this.containsDarkCheck() && anotherCell.containsLightCheck() || 
        this.containsLightCheck() && anotherCell.containsDarkCheck();
    }
    
    getCellLocatedBehind(anotherCell){
        let basicIndex = this.getIndex();
        let anotherCellIndex = anotherCell.getIndex();
        let deltaIndex = anotherCellIndex - basicIndex;
        let remoteNeighbourCell = field.cellByIndex(basicIndex + 2 * deltaIndex);
        return remoteNeighbourCell;
    }
}

class Check{
    parentCell;
    constructor(color){
        this.checkBody = document.createElement("div");
        this.checkBody.innerHTML += "<div class=\"innerCircle\"></div>";
        this.checkBody.master = this;
        this.addClass("check");  
        this.addClass(color);  
    }
    addClass(text){
        this.checkBody.classList.add(text);
    }
    toggleClass(text){
        this.checkBody.classList.toggle(text);
    }

    makeActivatable(){
        this.checkBody.addEventListener("click", this.prepareForAction);
    }

    isDark(){
        return this.checkBody.classList.contains("darkCheck")
    }

    isLight(){
        return this.checkBody.classList.contains("lightCheck")
    }

    canEat(){
        return this.whereCanEatFrom(this.parentCell).length > 0;
    }

    canEatFrom(cell){
        return this.whereCanEatFrom(cell).length > 0;
    }

    canMove(){
        let hasCellAvailable = false;
        let parentCellNeighbourIndexes = this.parentCell.findNeighboursToMove();
        parentCellNeighbourIndexes.forEach((index)=>{
            let cell = field.cellByIndex(index);
            if(cell.isEmpty()){
                hasCellAvailable = true;
            }
        })
        return hasCellAvailable;
    }

    whereCanEatFrom(cell){
        let cellsToGetThroughEat = new Array();
        let cellToPassThroughEatIndexes = cell.findNeighboursToEat();
        cellToPassThroughEatIndexes.forEach((index)=>{
            let neighbourCell = field.cellByIndex(index);
            let farNeighbourCell = cell.getCellLocatedBehind(neighbourCell);
            if (cell.isFilledWithEnemyCheckerInComparisonTo(neighbourCell) && farNeighbourCell.isEmpty()){
                cellsToGetThroughEat.push(farNeighbourCell);
            }
        })
        return cellsToGetThroughEat;
    }

    prepareForAction(){
        field.blurPreviouslySelectedChecker();
        this.master.toggleClass("selected");
        field.resetAcceptableCells();
        if(this.master.canEat()){
            letAvailableCellsAcceptEating(this.master);   
        } else {
            letAvailableCellsAcceptMoving(this.master);
        }
        
    }

    moveSlightlyTo(cell){
        this.toggleClass("moving");
        let direction = cell.pickDirectionRelatively(this.parentCell);
        this.checkBody.style.animationName = direction;
        setTimeout(()=>{
            this.checkBody.style.animationName = '';
            this.toggleClass("moving");
            cell.insertCheck(this);               
            field.reActivateCheckers()
        }, 500);
    }

    // checkForMultipleEating(){
    //     let availableFarNeighbourCells = this.whereCanEatFrom(this.parentCell);
    //     availableFarNeighbourCells.forEach((farNeighbourCell)=>{
    //         console.log(this.canEatFrom(farNeighbourCell));
    //         console.log(farNeighbourCell);
    //         if(this.canEatFrom(farNeighbourCell)){
    //             let secondInstanceAvailableCells = this.whereCanEatFrom(farNeighbourCell);
    //             console.log(secondInstanceAvailableCells);
    //         }
            
    //     })
    // }
}

function letAvailableCellsAcceptMoving(check){
    let checkParentCellNeighbourIndexes = check.parentCell.findNeighboursToMove();
    checkParentCellNeighbourIndexes.forEach((index)=>{
        cell = field.cellByIndex(index);
        if(cell.isEmpty()){
            cell.addClass("acceptable");
            cell.cellBody.addEventListener("click", ()=>{ 
                field.resetAcceptableCells();
                cell = field.cellByIndex(index);
                check.moveSlightlyTo(cell);                
            })
        }
    })
}

function letAvailableCellsAcceptEating(check){
    let availableFarNeighbourCells = check.whereCanEatFrom(check.parentCell);
    let basicIndex = check.parentCell.getIndex();
    availableFarNeighbourCells.forEach((farNeighbourCell)=>{
        let farIndex = farNeighbourCell.getIndex();
        farNeighbourCell.addClass("acceptable");
        farNeighbourCell.cellBody.addEventListener("click", ()=>{ 
            field.resetAcceptableCells();
            farNeighbourCell = field.cellByIndex(farIndex);
            check.toggleClass("moving");
            setTimeout(()=>{
                farNeighbourCell.insertCheck(check); 
                neighbourCell = field.cellByIndex(0.5 * (basicIndex + farIndex));
                neighbourCell.clear();
                field.reActivateCheckers()
            }, 500);
            // farNeighbourCell.insertCheck(check); 
            // neighbourCell = field.cellByIndex(0.5 * (basicIndex + farIndex));
            // neighbourCell.clear();
            // field.reActivateCheckers();
            })
        })
    }

field = new Field();
field.fillWithCells();
field.fillInitiallyWithCheckers();
field.reActivateCheckers();