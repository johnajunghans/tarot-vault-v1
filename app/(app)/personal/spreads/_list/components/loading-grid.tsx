import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingGrid() {
    return (
        <div className="">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                    <Card key={index} className="border-border/50">
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-14 rounded-full" />
                            </div>
                        </CardHeader>
                        <CardContent className="flex justify-center py-4">
                            <Skeleton className="h-[140px] w-[140px] rounded-xl" />
                        </CardContent>
                        <CardFooter className="justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
