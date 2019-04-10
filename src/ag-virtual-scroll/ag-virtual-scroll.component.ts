import { Component, Input, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, Renderer, OnInit } from '@angular/core';

@Component({
	selector: 'ag-virtual-scroll',
	templateUrl: './ag-virtual-scroll.component.html',
    styles: [`
        :host {
            display: block;
            position: relative;
            height: 100%;
            width: 100%;
            overflow-y: auto;
        }

        :host .content-height {
            width: 1px;
            opacity: 0;
        }

        :host .items-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }`
    ]
})
export class AgVirtualSrollComponent implements OnInit, AfterViewInit, OnChanges {
    @ViewChild('itemsContainer') private itemsContainerEl: ElementRef<HTMLElement>;

    @Input('min-row-height') private minRowHeight: number = 40;
    @Input('height') private height: string = 'auto';
    @Input('items') private originalItems: any[] = [];

    public items: any[] = [];

    public currentScroll: number = 0;
    public contentHeight: number = 0;
    public paddingTop: number = 0;

    public startIndex: number = 0;
    public endIndex: number = 0;

    private previousItemsHeight: number[] = [];

    public get numberItemsRendred(): number { return this.endIndex - this.startIndex; }

    constructor(
        private el: ElementRef<HTMLElement>,
        private renderer: Renderer
	) {
	}

    ngAfterViewInit() {
	}

    ngOnInit() {
        this.el.nativeElement.style.height = this.height;
        this.renderer.listen(this.el.nativeElement, 'scroll', this.onScroll.bind(this));
	}
	
	ngOnChanges(changes: SimpleChanges) {
		setTimeout(() => {

            if ('minRowHeight' in changes) {
                if (typeof this.minRowHeight === 'string') {
                    if (parseInt(this.minRowHeight))
                        this.minRowHeight = parseInt(this.minRowHeight);
                    else
                        this.minRowHeight = 40;
                }
            }

			if ('originalItems' in changes) {
                if (!this.originalItems) this.originalItems = [];
				this.previousItemsHeight = new Array(this.originalItems.length).fill(null);
				this.currentScroll = 0;
				this.defineDimensions();
				this.prepareDataVirtualScroll();
                this.itemsContainerEl.nativeElement.scrollTop = 0;
			}
		});
    }

	onScroll() {
        this.currentScroll = this.el.nativeElement.scrollTop;

        let childrens = this.getInsideChildrens();
        for (let i = 0; i < childrens.length; i++) {
            let children = childrens[i];
            let realIndex = this.startIndex + i;
            this.previousItemsHeight[realIndex] = children.getBoundingClientRect().height;
        }

        this.defineDimensions();
        this.prepareDataVirtualScroll();

        this.checkIsTable();
    }

    defineDimensions() {
        this.contentHeight = this.originalItems.reduce((prev, curr, i) => {
			let height = this.previousItemsHeight[i];
			return prev + (height ? height : this.minRowHeight);
		}, 0);

        if (this.currentScroll >= this.minRowHeight) {
            let newPaddingTop = 0;
            let itemsThatAreGone = 0;
            let initialScroll = this.currentScroll;

            for (let h of this.previousItemsHeight) {
                let height = h ? h : this.minRowHeight;
                if (initialScroll >= height) {
                    newPaddingTop += height;
                    initialScroll -= height;
                    itemsThatAreGone++;
                }
                else
                    break;
            }

            this.paddingTop = newPaddingTop;
            this.startIndex = itemsThatAreGone;
        }
        else {
            this.paddingTop = 0;
            this.startIndex = 0;
        }
    }

    prepareDataVirtualScroll() {
        this.endIndex = this.startIndex + Math.floor(this.el.nativeElement.clientHeight / this.minRowHeight) + 2;
        this.items = this.originalItems.slice(this.startIndex, this.endIndex);
                
        setTimeout(() => {
            let childrens = this.getInsideChildrens();
            for (let i = 0; i < childrens.length; i++) {
                let children = childrens[i] as HTMLElement;
                let realIndex = this.startIndex + i;
                children.style.minHeight = `${this.minRowHeight}px`;
                children.style.height = `${this.minRowHeight}px`;
                
                let className = (realIndex + 1) % 2 === 0 ? 'even' : 'odd';
                let unclassName = className == 'even' ? 'odd' : 'even';

                children.classList.add(`ag-virtual-scroll-${className}`);
                children.classList.remove(`ag-virtual-scroll-${unclassName}`);
            }
        });
    }

    getInsideChildrens() {
        let childrens = this.itemsContainerEl.nativeElement.children;
        if (childrens.length > 0) {
            if (childrens[0].tagName.toUpperCase() === 'TABLE') {
                childrens = childrens[0].children;
                if (childrens.length > 0) {
                    if (childrens[0].tagName.toUpperCase() === 'TBODY')
                        childrens = childrens[0].children;
                    else
                        childrens = childrens[1].children;
                }
            }

            return childrens;
        }
        return [];
    }

    checkIsTable() {
        let childrens = this.itemsContainerEl.nativeElement.children;
        if (childrens.length > 0) {
            if (childrens[0].tagName.toUpperCase() === 'TABLE') {
                childrens = childrens[0].children;
                if (childrens.length > 0) {
                    if (childrens[0].tagName.toUpperCase() === 'THEAD'){
                        let thead = childrens[0] as HTMLElement;
                        thead.style.transform = `translateY(${Math.abs(this.paddingTop - this.currentScroll)}px)`;
                    }
                }
            }
        }
    }
}
